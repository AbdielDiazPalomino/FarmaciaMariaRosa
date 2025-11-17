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
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Rutas públicas sin JWT
                    .requestMatchers("/api/auth/**").permitAll()
                    
                    .requestMatchers("/api/productos/**").permitAll() 
                    .requestMatchers("/api/categorias/**").permitAll() 
                    

                    // Solo ADMIN accede a estadísticas
                    .requestMatchers("/api/estadisticas/**").hasRole("ADMIN")

                    // ADMIN, CAJERO y SECRETARIO pueden ver productos, categorías, lotes y clientes
                    .requestMatchers(
                                     "/api/lotes/**",
                                     "/api/clientes/**").hasAnyRole("ADMIN", "CAJERO", "SECRETARIO")

                    // Reservas: ADMIN y CAJERO
                    .requestMatchers("/api/reservas/**").hasAnyRole("ADMIN", "CAJERO")

                    // Mensajes: ADMIN y SECRETARIO
                    .requestMatchers("/api/mensajes/**").hasAnyRole("ADMIN", "SECRETARIO")

                    // CLIENTE: acceso a su perfil o reservas
                    .requestMatchers("/api/clientes/perfil/**",
                                     "/api/clientes/reservas/**").hasRole("CLIENTE")

                    .requestMatchers("/usuarios/**").permitAll()  // CRUD usuarios sin token
                    
                    //.requestMatchers("/usuarios/**").hasRole("ADMIN")
                    
                    
                    // Todo lo demás requiere autenticación
                    .anyRequest().authenticated()
            );
        http.exceptionHandling(exception -> exception
                .accessDeniedHandler(accessDeniedHandler)
        );
        // Solo aplicar JWT filter a rutas que no sean /usuarios/**
        http.addFilterBefore(new JwtAuthenticationFilterExcluding("/usuarios/**", jwtFilter),
                             UsernamePasswordAuthenticationFilter.class);

        return http.build();
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
