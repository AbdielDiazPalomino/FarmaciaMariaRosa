package com.proyectouno.demo.Controller;

import com.proyectouno.demo.DTO.ProductoDTO;
import com.proyectouno.demo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import io.github.cdimascio.dotenv.Dotenv;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500"})
public class ChatAIController {

    @Autowired
    private ProductoRepository productoRepository;

    private final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private final String API_KEY;
    
    public ChatAIController() {
        Dotenv dotenv = Dotenv.load(); // Carga el archivo .env
        this.API_KEY = dotenv.get("GROQ_API_KEY");
    }

    @PostMapping("/chat-ai")
    public ResponseEntity<?> chatWithAI(@RequestBody Map<String, String> request) {
        try {
            String userMessage = request.get("message");
            
            // Obtener información de productos para el contexto
            List<ProductoDTO> productos = productoRepository.findAllWithCategoria().stream()
                    .map(producto -> new ProductoDTO(producto))
                    .collect(Collectors.toList());
            
            String productosContext = buildProductosContext(productos);
            
            // Preparar el prompt con contexto específico
            String systemPrompt = buildSystemPrompt(productosContext);
            
            // Llamar a la API de Groq
            String aiResponse = callGroqAPI(systemPrompt, userMessage);
            
            return ResponseEntity.ok(Map.of("response", aiResponse));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al comunicarse con la IA: " + e.getMessage()));
        }
    }

    private String buildProductosContext(List<ProductoDTO> productos) {
        StringBuilder context = new StringBuilder();
        context.append("PRODUCTOS DISPONIBLES EN LA FARMACIA:\n\n");
        
        for (ProductoDTO producto : productos) {
            context.append("• ").append(producto.getNombre())
                   .append(" - Precio: S/ ").append(producto.getPrecio())
                   .append(" - Stock: ").append(producto.getStockActual())
                   .append(" - Categoría: ").append(producto.getCategoriaNombre())
                   .append(" - Requiere receta: ").append(producto.getRequiereReceta() ? "Sí" : "No")
                   .append(" - Controlado: ").append(producto.getEsControlado() ? "Sí" : "No")
                   .append("\n");
            
            if (producto.getDescripcion() != null && !producto.getDescripcion().isEmpty()) {
                context.append("  Descripción: ").append(producto.getDescripcion()).append("\n");
            }
            
            if (producto.getLaboratorio() != null && !producto.getLaboratorio().isEmpty()) {
                context.append("  Laboratorio: ").append(producto.getLaboratorio()).append("\n");
            }
            
            if (producto.getPrincipioActivo() != null && !producto.getPrincipioActivo().isEmpty()) {
                context.append("  Principio activo: ").append(producto.getPrincipioActivo()).append("\n");
            }
            
            context.append("\n");
        }
        
        return context.toString();
    }

    private String buildSystemPrompt(String productosContext) {
        return "Eres un asistente virtual especializado de Farmacia María Rosa. " +
               "Tu función es ayudar a los clientes con información sobre productos farmacéuticos, " +
               "recomendaciones generales y consultas sobre disponibilidad.\n\n" +
               "INSTRUCCIONES IMPORTANTES:\n" +
               "1. SOLO responde preguntas relacionadas con medicamentos, productos de salud, y temas farmacéuticos\n" +
               "2. NO proporciones diagnósticos médicos\n" +
               "3. SIEMPRE recomienda consultar con un médico para problemas de salud específicos\n" +
               "4. Usa la siguiente información de productos para responder sobre disponibilidad y precios\n" +
               "5. Sé amable, profesional y útil\n" +
               "6. Si un producto requiere receta, infórmalo claramente\n" +
               "7. Si no sabes algo, reconócelo y sugiere consultar en la farmacia\n\n" +
               productosContext +
               "\nRecuerda: Solo información farmacéutica. Para emergencias médicas, deriva inmediatamente al médico.";
    }

    private String callGroqAPI(String systemPrompt, String userMessage) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // Estructura del request para Groq API
            Map<String, Object> requestBody = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.7,
                "max_tokens", 1024
            );
            
            // Headers
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Bearer " + API_KEY);
            headers.set("Content-Type", "application/json");
            
            org.springframework.http.HttpEntity<Map<String, Object>> entity = 
                new org.springframework.http.HttpEntity<>(requestBody, headers);
            
            // Hacer la llamada
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_API_URL, entity, Map.class);
            
            // Extraer la respuesta
            if (response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            
            return "Lo siento, no pude procesar tu pregunta en este momento.";
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling Groq API: " + e.getMessage());
        }
    }
}