FROM otel/opentelemetry-collector-contrib:0.114.0

COPY config.yaml /etc/otelcol/config.yaml

CMD ["--config=/etc/otelcol/config.yaml"]

EXPOSE 4317
EXPOSE 4318
EXPOSE 13133
