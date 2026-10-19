package com.gothsins.questlog.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deletedAccountTokenMustNotCrashAuthenticationFilter() {
        SecurityContextHolder.clearContext();
        JwtService jwtService = mock(JwtService.class);
        CustomUserDetailsService userDetails = mock(CustomUserDetailsService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetails);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Authorization", "Bearer valid-but-deleted");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        when(jwtService.extractUsername("valid-but-deleted")).thenReturn("deleted-user");
        when(userDetails.loadUserByUsername("deleted-user"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        assertDoesNotThrow(() -> filter.doFilter(request, response, chain));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(userDetails).loadUserByUsername("deleted-user");
    }
}
