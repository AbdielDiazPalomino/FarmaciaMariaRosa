package com.proyectouno.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String jwt = null;
        String username = null;

        // Extrae el token JWT del encabezado
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            username = jwtUtil.extractUsername(jwt);
            
            // ✅ DEBUG: Mostrar información del token
            System.out.println("🔐 JWT Filter - Usuario: " + username);
            System.out.println("🔐 JWT Filter - Token: " + jwt.substring(0, 20) + "...");
        }

        // Si hay usuario y no hay sesión autenticada
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                
                // ✅ OBTENER EL ROL DEL TOKEN JWT (no de la base de datos)
                String rolFromToken = extractRoleFromToken(jwt);
                System.out.println("🔐 JWT Filter - Rol del token: " + rolFromToken);
                
                // ✅ CREAR AUTHORITIES USANDO EL ROL DEL TOKEN
                List<GrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority(rolFromToken)
                );
                
                System.out.println("🔐 JWT Filter - Authorities: " + authorities);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities); // ✅ Usar authorities del token
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                System.out.println("✅ JWT Filter - Autenticación exitosa para: " + username);
            }
        }

        filterChain.doFilter(request, response);
    }

    // ✅ MÉTODO PARA EXTRAER EL ROL DEL TOKEN JWT
    private String extractRoleFromToken(String token) {
        try {
            // Extraer el claim "rol" del token
            return jwtUtil.extractClaim(token, claims -> claims.get("rol", String.class));
        } catch (Exception e) {
            System.out.println("❌ Error extrayendo rol del token: " + e.getMessage());
            return "CLIENTE"; // Rol por defecto
        }
    }
}