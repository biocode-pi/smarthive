#include "unihiker_k10.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "configuracao.h"

UNIHIKER_K10 k10;
AHT20 aht20;

const char *LIMITE = "----smarthiveK10";
unsigned long ultimoEnvio = 0;
volatile bool capturarAgora = false;

void mostrar(const String &linha1, const String &linha2 = "") {
  k10.canvas->canvasClear();
  k10.canvas->canvasText("SmartHive", 1, 0xF5A623);
  k10.canvas->canvasText(linha1.c_str(), 3, 0xFFFFFF);
  k10.canvas->canvasText(linha2.c_str(), 4, 0xFFFFFF);
  k10.canvas->updateCanvas();
}

void aoApertarA() {
  capturarAgora = true;
}

bool iniciarCamera() {
  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 8;
  config.pin_d1 = 10;
  config.pin_d2 = 11;
  config.pin_d3 = 9;
  config.pin_d4 = 18;
  config.pin_d5 = 16;
  config.pin_d6 = 15;
  config.pin_d7 = 6;
  config.pin_xclk = 7;
  config.pin_pclk = 17;
  config.pin_vsync = 4;
  config.pin_href = 5;
  config.pin_sscb_sda = 47;
  config.pin_sscb_scl = 48;
  config.pin_pwdn = -1;
  config.pin_reset = -1;
  config.xclk_freq_hz = 10000000;
  config.pixel_format = PIXFORMAT_RGB565;
  config.frame_size = FRAMESIZE_SVGA;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.fb_count = 2;
  if (esp_camera_init(&config) != ESP_OK) return false;
  sensor_t *sensor = esp_camera_sensor_get();
  if (sensor) sensor->set_hmirror(sensor, 1);
  return true;
}

void conectarWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  mostrar("Conectando Wi-Fi", WIFI_NOME);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_NOME, WIFI_SENHA);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(500);
  mostrar(WiFi.status() == WL_CONNECTED ? "Wi-Fi conectado" : "Sem Wi-Fi", WiFi.localIP().toString());
}

bool fotografar(uint8_t **jpeg, size_t *tamanho) {
  camera_fb_t *quadro = esp_camera_fb_get();
  if (quadro) esp_camera_fb_return(quadro);
  quadro = esp_camera_fb_get();
  if (!quadro) return false;
  bool ok = fmt2jpg(quadro->buf, quadro->len, quadro->width, quadro->height, quadro->format, QUALIDADE_JPEG, jpeg, tamanho);
  esp_camera_fb_return(quadro);
  return ok;
}

String campo(const char *nome, const String &valor) {
  return String("--") + LIMITE + "\r\nContent-Disposition: form-data; name=\"" + nome + "\"\r\n\r\n" + valor + "\r\n";
}

int enviar(const uint8_t *jpeg, size_t tamanhoJpeg, float temperatura, float umidade) {
  String inicio = campo("temperatura_c", String(temperatura, 1)) + campo("umidade_percentual", String(umidade, 1)) +
                  "--" + LIMITE + "\r\nContent-Disposition: form-data; name=\"foto\"; filename=\"k10.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String fim = String("\r\n--") + LIMITE + "--\r\n";

  size_t total = inicio.length() + tamanhoJpeg + fim.length();
  uint8_t *corpo = (uint8_t *)ps_malloc(total);
  if (!corpo) return -1;
  memcpy(corpo, inicio.c_str(), inicio.length());
  memcpy(corpo + inicio.length(), jpeg, tamanhoJpeg);
  memcpy(corpo + inicio.length() + tamanhoJpeg, fim.c_str(), fim.length());

  WiFiClientSecure cliente;
  cliente.setInsecure();
  HTTPClient http;
  http.setTimeout(30000);
  http.begin(cliente, ENDERECO);
  http.addHeader("Authorization", String("Dispositivo ") + CHAVE);
  http.addHeader("Content-Type", String("multipart/form-data; boundary=") + LIMITE);
  int status = http.POST(corpo, total);
  if (status > 0) Serial.println(http.getString());
  http.end();
  free(corpo);
  return status;
}

void capturarEEnviar() {
  conectarWifi();
  if (WiFi.status() != WL_CONNECTED) return;

  float temperatura = aht20.getData(AHT20::eAHT20TempC);
  float umidade = aht20.getData(AHT20::eAHT20HumiRH);
  mostrar("Fotografando...", String(temperatura, 1) + " C  " + String(umidade, 0) + " %");

  uint8_t *jpeg = nullptr;
  size_t tamanho = 0;
  if (!fotografar(&jpeg, &tamanho)) {
    mostrar("Falha na camera");
    return;
  }
  mostrar("Enviando...", String(tamanho / 1024) + " KB");
  int status = enviar(jpeg, tamanho, temperatura, umidade);
  free(jpeg);

  if (status == 201) {
    mostrar("Captura enviada", String(temperatura, 1) + " C  " + String(umidade, 0) + " %");
  } else if (status == 401) {
    mostrar("Chave recusada", "Gere outra no site");
  } else {
    mostrar("Erro no envio", "HTTP " + String(status));
  }
}

void setup() {
  Serial.begin(115200);
  k10.begin();
  k10.initScreen(2);
  k10.creatCanvas();
  k10.buttonA->setPressedCallback(aoApertarA);

  if (!iniciarCamera()) {
    mostrar("Camera nao iniciou");
    while (true) delay(1000);
  }
  conectarWifi();
  capturarAgora = true;
}

void loop() {
  if (capturarAgora || millis() - ultimoEnvio >= INTERVALO_MS) {
    capturarAgora = false;
    ultimoEnvio = millis();
    capturarEEnviar();
  }
  delay(50);
}
