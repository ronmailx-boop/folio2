// הופך פקודות {sql, params} לטקסט SQL עבור `wrangler d1 execute --file`.
export function literal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

export function toSql(statements) {
  return statements
    .map(({ sql, params }) => {
      let i = 0;
      return sql.replace(/\?/g, () => literal(params[i++])) + ';';
    })
    .join('\n') + '\n';
}
