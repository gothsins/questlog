package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DiscoveryTaxonomyServiceTest {
    @Test
    void resolvesCategoryIdsFromProviderSlugsInsteadOfAssumingNumbers() {
        IgdbClient client = mock(IgdbClient.class);
        when(client.query(eq("/genres"), anyString(), eq(IgdbTaxon[].class)))
                .thenReturn(List.of(new IgdbTaxon(53L, "Shooter", "shooter"),
                        new IgdbTaxon(97L, "Indie", "indie")));
        when(client.query(eq("/player_perspectives"), anyString(), eq(IgdbTaxon[].class)))
                .thenReturn(List.of(new IgdbTaxon(81L, "First person", "first-person")));
        DiscoveryTaxonomyService taxonomy = new DiscoveryTaxonomyService(client);

        assertEquals(new DiscoveryGenres(53L, 97L), taxonomy.genres());
        assertEquals(81L, taxonomy.firstPersonId());
    }

    @Test
    void missingMetadataDoesNotBecomeAnUnrelatedCollection() {
        IgdbClient client = mock(IgdbClient.class);
        when(client.query(eq("/genres"), anyString(), eq(IgdbTaxon[].class)))
                .thenReturn(List.of(new IgdbTaxon(53L, "Shooter", "shooter")));
        assertThrows(IllegalStateException.class, () -> new DiscoveryTaxonomyService(client).genres());
    }
}
