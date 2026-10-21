package com.gothsins.questlog.integration;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import com.gothsins.questlog.library.LibraryEntryRepository;
import com.gothsins.questlog.library.LibraryEntryService;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserAvatarRepository;
import com.gothsins.questlog.user.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.json.JsonMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "igdb.client-id=audit-offline",
        "igdb.client-secret=audit-offline"
})
@AutoConfigureMockMvc
class SecurityBoundariesIT {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private GameRepository games;
    @Autowired private LibraryEntryRepository entries;
    @Autowired private LibraryEntryService libraryService;
    @Autowired private UserAvatarRepository avatars;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private JsonMapper json;
    @MockitoBean private IgdbClient igdbClient;
    @Value("${security.jwt.secret}") private String jwtSecret;

    @Test
    void protectedWritesRequireValidBearerEvenWhenARequestCarriesACookie() throws Exception {
        User player = player();
        Game game = game();
        long entryId = libraryService.addGameToLibrary(player.getId(), game.getId()).id();
        String update = "{\"rating\":7}";
        String review = "{\"content\":\"A synthetic review with enough characters.\"}";
        MockMultipartFile image = avatarFile();

        mvc.perform(patch("/api/library/{id}", entryId)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/users/me")
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"intruder\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/users/me/avatar").file(image)
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie")))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/library/{id}/review", entryId)
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie"))
                        .contentType(MediaType.APPLICATION_JSON).content(review))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/library/{id}", entryId)
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/library/import")
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"igdbId\":42}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/users/me/avatar")
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", "untrusted-cookie")))
                .andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", "Bearer invalid.jwt.value")
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isUnauthorized());

        String expired = Jwts.builder()
                .subject(player.getUsername())
                .issuedAt(Date.from(Instant.now().minusSeconds(120)))
                .expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                .compact();
        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", "Bearer " + expired)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isUnauthorized());

        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", bearer(player))
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(7));
        assertFalse(avatars.existsById(player.getId()));
        assertNull(users.findById(player.getId()).orElseThrow().getNickname());
    }

    @Test
    void aPlayerCannotModifyAnotherPlayersLibraryReviewOrProfile() throws Exception {
        User owner = player();
        User other = player();
        Game ownedGame = game();
        long entryId = libraryService.addGameToLibrary(owner.getId(), ownedGame.getId()).id();
        String ownerToken = bearer(owner);
        String otherToken = bearer(other);
        String review = "{\"content\":\"A synthetic review with enough characters.\"}";

        mvc.perform(put("/api/library/{id}/review", entryId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(review))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":1}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/library/{id}", entryId)
                        .header("Authorization", otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/library/{id}/review", entryId)
                        .header("Authorization", otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/library/{id}/review", entryId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON).content(review))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/library/{id}/review", entryId)
                        .header("Authorization", otherToken))
                .andExpect(status().isNotFound());

        mvc.perform(patch("/api/users/me")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"" + other.getUsername() + "\"}"))
                .andExpect(status().isOk());
        mvc.perform(multipart("/api/users/me/avatar").file(avatarFile())
                        .header("Authorization", otherToken))
                .andExpect(status().isOk());
        assertNull(users.findById(owner.getId()).orElseThrow().getNickname());
        assertFalse(avatars.existsById(owner.getId()));
        assertTrue(avatars.existsById(other.getId()));

        long libraryCount = entries.count();
        long gameCount = games.count();
        mvc.perform(get("/api/library").header("Authorization", otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/games/{id}", ownedGame.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isOk());
        mvc.perform(get("/api/games/{id}/reviews", ownedGame.getId())
                        .header("Authorization", otherToken))
                .andExpect(status().isOk());
        long discoveryId = 100_000_000L + ownedGame.getId();
        when(igdbClient.findGameDetailsById(discoveryId)).thenReturn(Optional.of(
                new IgdbGameDetailsResponse(discoveryId, ownedGame.getTitle(),
                        "Synthetic metadata", List.of(), List.of(), List.of())));
        mvc.perform(get("/api/discovery/games/{igdbId}", discoveryId)
                        .header("Authorization", otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.igdbId").value(discoveryId));
        assertEquals(libraryCount, entries.count());
        assertEquals(gameCount, games.count());

        Game importedGame = game();
        importedGame.setIgdbId(100_000_000L + importedGame.getId());
        games.saveAndFlush(importedGame);
        long importedEntryId = json.readTree(mvc.perform(post("/api/library/import")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"igdbId\":" + importedGame.getIgdbId() + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("WISHLIST"))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        assertEquals(other.getId(), entries.findById(importedEntryId)
                .orElseThrow().getUser().getId());
    }

    private User player() {
        User user = new User();
        user.setUsername("audit_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        user.setPassword(passwordEncoder.encode("synthetic-audit-password"));
        return users.saveAndFlush(user);
    }

    private Game game() {
        Game game = new Game();
        game.setTitle("Synthetic audit " + UUID.randomUUID());
        return games.saveAndFlush(game);
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getUsername());
    }

    private MockMultipartFile avatarFile() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return new MockMultipartFile("file", "avatar.png", "image/png", output.toByteArray());
    }
}
