package com.proyectouno.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // 👇 IMPORTANTE: esta clave debe ser BASE64 válida y de 256 bits (32 bytes).
    // Puedes generar una nueva con: Base64.getEncoder().encodeToString("mi_clave_super_segura_1234567890123456".getBytes());
    private static final String SECRET_KEY = "bWlfY2xhdmVfc3VwZXJfc2VndXJhXzEyMzQ1Njc4OTAxMjM0NTY2";

    // ======= Extraer información del token =======
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

     // ======= Extraer rol del token =======
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("rol", String.class));
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ======= Generar token con UserDetails (versión antigua) =======
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    // ======= Nueva versión: token con email y rol =======
    public String generateToken(String email, String rol) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hora
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ======= Validación =======
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
