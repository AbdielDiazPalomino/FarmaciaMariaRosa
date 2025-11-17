package com.proyectouno.demo.Controller;

import com.proyectouno.demo.models.Usuario;
import com.proyectouno.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ================== CREAR USUARIO ==================
    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
        try {
            // Validar que el email no exista
            if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
                return new ResponseEntity<>("El email ya está registrado", HttpStatus.BAD_REQUEST);
            }

            // Validar campos obligatorios
            if (usuario.getPasswordHash() == null || usuario.getPasswordHash().trim().isEmpty()) {
                return new ResponseEntity<>("La contraseña es obligatoria", HttpStatus.BAD_REQUEST);
            }

            // Cifrar la contraseña
            String passwordCifrada = passwordEncoder.encode(usuario.getPasswordHash());
            usuario.setPasswordHash(passwordCifrada);

            // Establecer fechas
            usuario.setFechaCreacion(LocalDateTime.now());
            usuario.setEstado(usuario.getEstado() != null ? usuario.getEstado() : true);

            Usuario nuevoUsuario = usuarioRepository.save(usuario);
            return new ResponseEntity<>(nuevoUsuario, HttpStatus.CREATED);

        } catch (Exception e) {
            return new ResponseEntity<>("Error al crear usuario: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ================== LISTAR TODOS LOS USUARIOS ==================
    @GetMapping
    public List<Usuario> obtenerTodosUsuarios() {
        return usuarioRepository.findAll();
    }

    // ================== OBTENER USUARIO POR ID ==================
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(@PathVariable Long id) {
        Optional<Usuario> usuario = usuarioRepository.findById(id);
        if (usuario.isPresent()) {
            return new ResponseEntity<>(usuario.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ================== ACTUALIZAR USUARIO ==================
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuarioActualizado) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findById(id);

        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();
            usuario.setNombre(usuarioActualizado.getNombre());
            usuario.setEmail(usuarioActualizado.getEmail());
            usuario.setPasswordHash(usuarioActualizado.getPasswordHash());
            usuario.setRol(usuarioActualizado.getRol());
            usuario.setEstado(usuarioActualizado.getEstado());
            usuario.setFechaActualizacion(LocalDateTime.now());

            usuarioRepository.save(usuario);
            return new ResponseEntity<>(usuario, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // ================== ELIMINAR USUARIO ==================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        Optional<Usuario> usuario = usuarioRepository.findById(id);
        if (usuario.isPresent()) {
            usuarioRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
