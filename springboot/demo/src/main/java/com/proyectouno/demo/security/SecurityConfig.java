package com.proyectouno.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }
    
    @Autowired
    private CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSourceSecuruty()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Rutas públicas sin JWT
                    .requestMatchers("/api/auth/**").permitAll()
                    
                    .requestMatchers("/api/productos/**").permitAll() 
                    .requestMatchers("/api/categorias/**").permitAll() 
                    

                    // Solo ADMIN accede a estadísticas
                    .requestMatchers("/api/estadisticas/**").hasAuthority("ADMIN") // ✅ CAMBIADO

                    // ADMIN, CAJERO y SECRETARIO pueden ver productos, categorías, lotes y clientes
                    .requestMatchers(
                                     "/api/lotes/**",
                                     "/api/clientes/**").hasAnyAuthority("ADMIN", "CAJERO", "SECRETARIO") // ✅ CAMBIADO

                    // Reservas: ADMIN y CAJERO
                    .requestMatchers("/api/reservas/**").hasAnyAuthority("ADMIN", "CAJERO") // ✅ CAMBIADO

                    // Mensajes: ADMIN y SECRETARIO
                    .requestMatchers("/api/mensajes/**").hasAnyAuthority("ADMIN", "SECRETARIO") // ✅ CAMBIADO

                    // CLIENTE: acceso a su perfil o reservas
                    .requestMatchers("/api/clientes/perfil/**",
                                     "/api/clientes/reservas/**").hasAuthority("CLIENTE") // ✅ CAMBIADO

                    .requestMatchers("/usuarios/**").permitAll()  // CRUD usuarios sin token
                    
                    // Todo lo demás requiere autenticación
                    .anyRequest().authenticated()
            );
        http.exceptionHandling(exception -> exception
                .accessDeniedHandler(accessDeniedHandler)
        );
        
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSourceSecuruty() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://127.0.0.1:5500", "http://localhost:5500"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}