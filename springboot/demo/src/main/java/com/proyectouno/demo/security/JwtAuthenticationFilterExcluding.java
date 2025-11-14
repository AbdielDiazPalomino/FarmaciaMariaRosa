package com.proyectouno.demo.security;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilterExcluding extends OncePerRequestFilter {

    private final String excludePath;
    private final JwtAuthenticationFilter jwtFilter;

    public JwtAuthenticationFilterExcluding(String excludePath, JwtAuthenticationFilter jwtFilter) {
        this.excludePath = excludePath;
        this.jwtFilter = jwtFilter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (request.getRequestURI().startsWith(excludePath)) {
            filterChain.doFilter(request, response); // Ignorar JWT
        } else {
            jwtFilter.doFilter(request, response, filterChain); // Aplicar JWT normalmente
        }
    }
}
