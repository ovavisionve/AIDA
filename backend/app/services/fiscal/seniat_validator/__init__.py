"""
Motor de Validación SENIAT V1.4

Implementa las reglas de validación definidas en el documento oficial:
"REGLAS DE VALIDACIÓN DE DATOS PARA INTERFACES DE PROGRAMACIÓN DE APLICACIONES (API)
PARA IMPRENTA DIGITALES Y SISTEMAS DE FACTURACIÓN HOMOLOGADOS"
GGTIC.GIT.00.02 / Versión 1.4 - Agosto 2025

Módulos:
- catalogs: Los 21 catálogos oficiales SENIAT
- errors: Códigos de retorno y errores de validación (~70 códigos)
- schemas: Modelos Pydantic que reflejan la estructura JSON SENIAT V1.4
- calculator: Validación de cálculos (totales, IVA, IGTF, retenciones)
- validator: Motor principal de validación
"""

from .validator import SeniatValidator, ValidationResult

__all__ = ["SeniatValidator", "ValidationResult"]
