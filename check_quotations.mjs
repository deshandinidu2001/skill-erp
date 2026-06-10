import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching estimations...");
  const { data: estimations, error: estError } = await supabase
    .from('estimations')
    .select('*, leads(*, customers(*))');

  if (estError) {
    console.error("Error fetching estimations:", estError);
  } else {
    console.log(`Found ${estimations.length} estimations:`);
    for (const est of estimations) {
      console.log(`- ID: ${est.id}, Code: ${est.estimation_code}, Customer: ${est.leads?.customers?.display_name || est.leads?.customers?.name || 'Unknown'}, Status: ${est.status}, Subtotal: ${est.subtotal}, Grand Total: ${est.grand_total}`);
    }
  }

  console.log("\nFetching quotations...");
  const { data: quotations, error: quoError } = await supabase
    .from('quotations')
    .select('*, leads(*, customers(*))');

  if (quoError) {
    console.error("Error fetching quotations:", quoError);
  } else {
    console.log(`Found ${quotations.length} quotations:`);
    for (const quo of quotations) {
      console.log(`- ID: ${quo.id}, Code: ${quo.quotation_no || quo.code}, Customer: ${quo.leads?.customers?.display_name || quo.leads?.customers?.name || 'Unknown'}, Status: ${quo.status}, Grand Total: ${quo.grand_total}`);
    }
  }
}

main();
