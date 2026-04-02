// This file is loaded as a module - see script type="module" in HTML
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var SUPABASE_URL = 'https://fqoixiqanzlfystkkpac.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2l4aXFhbnpsZnlzdGtrcGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDAxMzgsImV4cCI6MjA5MDcxNjEzOH0.pqxrRmcyQRmZGaW-hnp1HeWKU_2UDUA10lrgNJV6HmQ';

window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.generateRoomCode = function() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};
