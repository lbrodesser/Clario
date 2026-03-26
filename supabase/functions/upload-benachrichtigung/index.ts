import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.dokument_id) {
      return new Response(
        JSON.stringify({ error: 'Kein Dokument-Eintrag' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Dokument -> Checkliste -> Mandant -> Kanzlei
    const { data: dokument } = await supabase
      .from('dokumente')
      .select('titel, checkliste_id')
      .eq('id', record.dokument_id)
      .single()

    if (!dokument) {
      return new Response(JSON.stringify({ error: 'Dokument nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: checkliste } = await supabase
      .from('checklisten')
      .select('mandant_id')
      .eq('id', dokument.checkliste_id)
      .single()

    if (!checkliste) {
      return new Response(JSON.stringify({ error: 'Checkliste nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: mandant } = await supabase
      .from('mandanten')
      .select('name, kanzlei_id')
      .eq('id', checkliste.mandant_id)
      .single()

    if (!mandant) {
      return new Response(JSON.stringify({ error: 'Mandant nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: kanzlei } = await supabase
      .from('kanzleien')
      .select('name, email')
      .eq('id', mandant.kanzlei_id)
      .single()

    if (!kanzlei) {
      return new Response(JSON.stringify({ error: 'Kanzlei nicht gefunden' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // E-Mail an Kanzlei
    if (resendKey) {
      const qualitaetWarnung = record.qualitaet_trotzdem_hochgeladen === true

      const warnungHtml = qualitaetWarnung
        ? `<div style="padding: 12px 16px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; margin: 16px 0;">
            <p style="color: #c2410c; margin: 0; font-size: 14px;">Bildqualitaet pruefen — Mandant hat trotz Warnung hochgeladen.</p>
          </div>`
        : ''

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: `Clario <noreply@clario.de>`,
          to: kanzlei.email,
          subject: `${mandant.name} hat ${dokument.titel} hochgeladen`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${kanzlei.name}</h2>
              <p><strong>${mandant.name}</strong> hat <strong>${dokument.titel}</strong> hochgeladen.</p>
              ${warnungHtml}
              <p style="color: #6b7280; font-size: 14px;">Datei: ${record.dateiname}</p>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        console.error('Resend API Fehler:', emailResponse.status, await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: 'Benachrichtigung fehlgeschlagen' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
