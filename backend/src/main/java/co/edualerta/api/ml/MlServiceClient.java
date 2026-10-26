package co.edualerta.api.ml;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;


@Service
public class MlServiceClient {

    private final RestClient restClient;

    public MlServiceClient(
            RestClient.Builder builder,
            @Value("${ml.service.base-url:http://localhost:8000}") String baseUrl
    ) {
        // Evita que una llamada al componente experimental bloquee indefinidamente la API.
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(3_000);
        requestFactory.setReadTimeout(15_000);
        this.restClient = builder
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public JsonNode get(String path) {
        try {
            JsonNode response = restClient.get()
                    .uri(path)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "El servicio de análisis devolvió una respuesta vacía"
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Error del servicio ML (HTTP "
                            + exception.getStatusCode().value()
                            + "): "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "El servicio de análisis no está disponible",
                    exception
            );
        }
    }

    /** Envía una petición POST sin cuerpo, por ejemplo, para entrenar el modelo. */
    public JsonNode post(String path) {
        try {
            JsonNode response = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "El servicio de análisis devolvió una respuesta vacía"
                );
            }

            return response;

        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Error del servicio ML (HTTP "
                            + exception.getStatusCode().value()
                            + "): "
                            + exception.getResponseBodyAsString(),
                    exception
            );

        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No fue posible conectar con el servicio de análisis",
                    exception
            );
        }
    }

    /** Reenvía el árbol JSON mediante el conversor Jackson de Spring. */
    public JsonNode post(String path, JsonNode requestBody) {
        if (requestBody == null || requestBody.isNull() || !requestBody.isObject()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El cuerpo de la predicción debe ser un objeto JSON"
            );
        }

        try {
            JsonNode response = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    // Se entrega JsonNode, no byte[]: Jackson escribe el cuerpo JSON correctamente.
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "El servicio de análisis devolvió una respuesta vacía"
                );
            }
            return response;

        } catch (RestClientResponseException exception) {
            // Conserva el código original en el mensaje para distinguir validación de fallo de red.
            HttpStatus apiStatus = switch (exception.getStatusCode().value()) {
                case 400, 422 -> HttpStatus.BAD_REQUEST;
                case 409 -> HttpStatus.CONFLICT;
                case 429 -> HttpStatus.TOO_MANY_REQUESTS;
                default -> HttpStatus.BAD_GATEWAY;
            };
            throw new ResponseStatusException(
                    apiStatus,
                    "El servicio ML respondió HTTP "
                            + exception.getStatusCode().value()
                            + ": "
                            + exception.getResponseBodyAsString(),
                    exception
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "No fue posible conectar con el servicio de análisis",
                    exception
            );
        }
    }

}



