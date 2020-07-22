export const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})
