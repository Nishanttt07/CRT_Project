const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://eckiqexrwaoqzlsqmsch.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVja2lxZXhyd2FvcXpsc3Ftc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTc5MzIsImV4cCI6MjA5NzA5MzkzMn0.jtmrWHa5Ures-OTHCPHwFPxP9egbP6rckNgpI4MvcW0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTrigger() {
  const email = `tailor_trigger_test_${Math.floor(Math.random() * 100000)}@example.com`
  const password = 'Password123!'
  console.log(`Testing signup and trigger for tailor: ${email}`)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: 'test_tailor_trigger',
          phone: `+447911${Math.floor(Math.random() * 100000)}`,
          is_tailor: true,
          shop_name: 'Trigger Test Shop',
          shop_bio: 'Validating trigger inserts',
          shop_address: '123 Trigger St',
          shop_latitude: 51.5,
          shop_longitude: -0.12
        }
      }
    })

    if (error) {
      console.error('Signup Error:', error)
      return
    }

    const userId = data.user.id
    console.log(`Signup success. User ID: ${userId}`)

    // Wait 2 seconds for trigger processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Query public.users
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    console.log('User row in public.users:', userRow, userError)

    // Query public.shops
    const { data: shopRow, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    console.log('Shop row in public.shops:', shopRow, shopError)

  } catch (err) {
    console.error('Exception:', err)
  }
}

testTrigger()
