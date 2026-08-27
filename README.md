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
- Vercel Web Analytics para visitantes, visualizações de página e eventos de uso.
- Vercel Speed Insights para métricas reais de performance e Core Web Vitals.

## Analytics da Vercel

O frontend carrega os scripts first-party do Web Analytics e do Speed Insights. Os eventos personalizados registram apenas ações e contagens gerais; valores informados na calculadora e nomes cadastrados não são enviados.

Depois do deploy, habilite **Analytics** e **Speed Insights** no painel do projeto na Vercel. A coleta acontece apenas quando a aplicação está hospedada na Vercel; em `localhost`, as rotas `/_vercel/*` não existem.

Eventos personalizados configurados:

- `calculation_updated`
- `settings_opened`
- `settings_item_added`
- `settings_item_removed`
- `settings_reset`
- `settings_saved`

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
