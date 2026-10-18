package com.gothsins.questlog.integration;

import com.gothsins.questlog.auth.PwnedPasswordClient;
import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.matches;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "security.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "security.jwt.expiration=3600000",
        "igdb.client-id=test-client",
        "igdb.client-secret=test-secret"
})
@AutoConfigureMockMvc
class PlayerJourneyIT {
    @Autowired private MockMvc mvc;
    @Autowired private GameRepository games;
    @Autowired private JsonMapper json;
    @MockitoBean private PwnedPasswordClient pwnedClient;

    private JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void authenticatesAndEnforcesOwnershipAcrossThePlayerJourney() throws Exception {
        // A valid range response exercises the real SHA-1 suffix check without external HTTP.
        when(pwnedClient.fetchRange(matches("[0-9A-F]{5}")))
                .thenReturn("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0");

        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String owner = "owner_" + suffix;
        String reader = "reader_" + suffix;
        String password = "Local-journey-" + suffix;
        String remoteAddress = "198.18."
                + Integer.parseInt(suffix.substring(0, 2), 16) + "."
                + Integer.parseInt(suffix.substring(2, 4), 16);

        for (String username : new String[]{owner, reader}) {
            mvc.perform(post("/api/auth/register")
                            .with(request -> { request.setRemoteAddr(remoteAddress); return request; })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new Credentials(username, password))))
                    .andExpect(status().isCreated());
        }
        verify(pwnedClient, org.mockito.Mockito.times(2))
                .fetchRange(matches("[0-9A-F]{5}"));

        mvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr(remoteAddress); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new Credentials(owner, "incorrect-local-password"))))
                .andExpect(status().isUnauthorized());
        String ownerToken = login(owner, password, remoteAddress);
        String readerToken = login(reader, password, remoteAddress);

        mvc.perform(get("/api/library"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/library").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        Game game = new Game();
        game.setTitle("Synthetic journey " + suffix);
        long gameId = games.saveAndFlush(game).getId();

        MvcResult added = mvc.perform(post("/api/library")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"gameId\":" + gameId + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        long entryId = body(added).get("id").asLong();

        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PLAYING\",\"rating\":9}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PLAYING"))
                .andExpect(jsonPath("$.rating").value(9));
        mvc.perform(get("/api/games/{id}", gameId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(game.getTitle()));

        mvc.perform(put("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"First synthetic review with enough characters.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(9));
        mvc.perform(get("/api/games/{id}/reviews", gameId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value(owner));
        mvc.perform(get("/api/library").header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(patch("/api/library/{id}", entryId)
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":1}"))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isNotFound());
        mvc.perform(put("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Reader must not edit another player's review.\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isNotFound());

        mvc.perform(put("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Updated synthetic review after another journey.\"}"))
                .andExpect(status().isOk());
        MvcResult ownReview = mvc.perform(get("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals("Updated synthetic review after another journey.",
                body(ownReview).get("content").asText());

        mvc.perform(delete("/api/library/{id}/review", entryId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
        MvcResult feed = mvc.perform(get("/api/games/{id}/reviews", gameId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk())
                .andReturn();
        assertEquals(0, body(feed).size());
    }

    private String login(String username, String password, String remoteAddress) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login")
                        .with(request -> { request.setRemoteAddr(remoteAddress); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new Credentials(username, password))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).get("token").asText();
    }

    private record Credentials(String username, String password) {}
}
