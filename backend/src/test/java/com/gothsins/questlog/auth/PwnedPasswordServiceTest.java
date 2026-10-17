package com.gothsins.questlog.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PwnedPasswordServiceTest {
    private static final String PASSWORD_SUFFIX =
            "1E4C9B93F3F0682250B6CF8331B7EE68FD8";
    private final PwnedPasswordClient client = mock(PwnedPasswordClient.class);
    private final PwnedPasswordService service =
            new PwnedPasswordService(client, true);

    @Test
    void sendsOnlyFiveHexCharactersAndMatchesSuffixLocally() {
        when(client.fetchRange("5BAA6"))
                .thenReturn(PASSWORD_SUFFIX + ":3303003\r\n");
        assertTrue(service.isCompromised("password"));
        verify(client).fetchRange("5BAA6");
        verifyNoMoreInteractions(client);
    }

    @Test
    void ignoresPaddingEntriesWithZeroCount() {
        when(client.fetchRange("5BAA6"))
                .thenReturn(PASSWORD_SUFFIX + ":0\r\n");
        assertFalse(service.isCompromised("password"));
    }

    @Test
    void treatsMissingSuffixAsClearButMalformedResponseAsUnavailable() {
        when(client.fetchRange("5BAA6"))
                .thenReturn("0".repeat(35) + ":1\r\n")
                .thenReturn("not a valid range response")
                .thenReturn("");
        assertFalse(service.isCompromised("password"));
        assertThrows(PwnedPasswordUnavailableException.class,
                () -> service.isCompromised("password"));
        assertThrows(PwnedPasswordUnavailableException.class,
                () -> service.isCompromised("password"));
    }

    @Test
    void propagatesOutageWithoutCallingItAValidPassword() {
        when(client.fetchRange("5BAA6"))
                .thenThrow(new PwnedPasswordUnavailableException());
        assertThrows(PwnedPasswordUnavailableException.class,
                () -> service.isCompromised("password"));
    }

    @Test
    void canBeDisabledExplicitlyForOfflineEnvironments() {
        assertFalse(new PwnedPasswordService(client, false)
                .isCompromised("password"));
        verifyNoInteractions(client);
    }
}
