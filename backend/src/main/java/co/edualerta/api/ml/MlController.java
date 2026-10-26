package co.edualerta.api.ml;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ml")
public class MlController {

    private final MlServiceClient mlServiceClient;

    public MlController(MlServiceClient mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }

    @GetMapping("/health")
    public JsonNode health() {
        return mlServiceClient.get("/health");
    }

    @GetMapping("/datasets")
    public JsonNode datasets() {
        return mlServiceClient.get("/datasets");
    }

    @GetMapping("/datasets/validate")
    public JsonNode validateDatasets() {
        return mlServiceClient.get("/datasets/validate");
    }

    @GetMapping("/datasets/prepare")
    public JsonNode prepareDatasets() {
        return mlServiceClient.get("/datasets/prepare");
    }

    @GetMapping("/modeling/readiness")
    public JsonNode modelingReadiness() {
        return mlServiceClient.get("/modeling/readiness");
    }

    @GetMapping("/modeling/synthetic-readiness")
    public JsonNode syntheticReadiness() {
        return mlServiceClient.get("/modeling/synthetic-readiness");
    }

    @PostMapping("/modeling/train")
    public JsonNode trainModel() {
        return mlServiceClient.post("/modeling/train");
    }

    @PostMapping("/modeling/predict")
    public JsonNode predict(@RequestBody JsonNode input) {
        return mlServiceClient.post("/modeling/predict", input);
    }
}



