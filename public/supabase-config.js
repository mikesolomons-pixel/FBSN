const SUPABASE_URL = 'https://fqoixiqanzlfystkkpac.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2l4aXFhbnpsZnlzdGtrcGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAxMzgsImV4cCI6MjA5MDcxNjEzOH0.pqxrRmcyQRmZGaW-hnp1HeWKU_2UDUA10lrgNJV6HmQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
