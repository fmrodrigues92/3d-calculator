# Calculadora de impressão 3D

Aplicação Node.js simples para calcular custo de produção e preço de venda de peças impressas em 3D.

## Recursos

- Cadastro de filamentos com preço/kg e custo de máquina/hora.
- Cadastro de formas de pagamento e taxa percentual.
- Peso, tempo, quantidade de peças, embalagem e outros custos.
- Margem de lucro calculada sobre o preço final.
- Comparação simultânea de todos os filamentos.
- Custo total, custo por unidade, preço total e preço por unidade.
- Configurações persistidas no `localStorage` do navegador.

## Executar

```bash
npm install
npm start
```

Depois acesse:

```text
http://localhost:3000
```

Durante desenvolvimento:

```bash
npm run dev
```

## Fórmulas

```text
material = peso_em_kg × preço_por_kg
máquina = horas_de_impressão × custo_hora
custo = material + máquina + embalagem + outros
preço_sem_taxa = custo / (1 - margem)
preço_final = preço_sem_taxa / (1 - taxa_pagamento)
```
