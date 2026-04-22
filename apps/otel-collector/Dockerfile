FROM otel/opentelemetry-collector-contrib:0.150.1

ARG CONFIG_FILE=config.yaml

COPY ${CONFIG_FILE} /etc/otelcol/config.yaml

CMD ["--config=/etc/otelcol/config.yaml"]

EXPOSE 4317
EXPOSE 4318
EXPOSE 13133
