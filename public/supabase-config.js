// This file is loaded as a module - see script type="module" in HTML
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var SUPABASE_URL = 'https://agttapgbzublulpnmqqk.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndHRhcGdienVibHVscG5tcXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDc3MTUsImV4cCI6MjA4ODkyMzcxNX0.npnxk96JxS1SKSHMeU5IxAIL3G2ZYtGzWT1mPpRfxj8';

window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.generateRoomCode = function() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};
