# Revisão independente — AI-002, rodada 3

**Data:** 2026-03-31

## Resultado do gate

**Reprovado.** As duas revisões independentes foram feitas em paralelo; ambas tiveram zero achados `must-fix`, mas ficaram abaixo do mínimo de 94%.

| Revisor | Pontuação | Must-fix | Should-fix | Decisão |
|---|---:|---:|---:|---|
| A | 92% | 0 | 2 | Reprovar |
| B | 91% | 0 | 3 | Reprovar |

Os revisores não puderam executar os comandos npm em seus ambientes isolados. O gate previamente executado localmente permanece registrado, mas não foi reproduzido por eles.

## Achados confirmados para correção

1. **Limite de corpo HTTP:** `bodyOf()` deixa de acumular conteúdo depois de 1 MiB, porém continua consumindo a solicitação até o fim. Rejeitar imediatamente com `413 Payload Too Large`, usar `Content-Length` como caminho rápido e encerrar/destruir o fluxo ao exceder o limite. Adicionar cobertura para o limite exato e para `413`.
2. **Sincronização e cobertura E2E dos filtros:** depois do cancelamento, a atualização assíncrona pode competir com solicitações de filtro; filtros por estado não aguardam a resposta correspondente. Sincronizar cada atualização. Além disso, validar que a lista inteira renderizada pertence ao recurso filtrado, em vez de selecionar localmente um item cujo texto corresponde.
3. **Registro de erro interno no backend:** respostas internas não expõem detalhes, corretamente, mas a falha também não é registrada no servidor. Registrar somente falhas inesperadas, sem incluir stack/detalhes na resposta ao cliente.

## Considerações não bloqueadoras

- Usar uma data E2E determinística e segura para horário de verão.
- Cobrir `Referrer-Policy`, ausência de `Content-Type`, `application/json; charset=utf-8` e cabeçalhos em respostas de erro.
- Extrair o bloco repetido de aplicação sincronizada dos filtros (duplicação).
- Expandir a matriz de datas inválidas/válidas.
- Confirmar a alteração de metadados `dev` em `package-lock.json`; o usuário autorizou mantê-la.
