import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eckiqexrwaoqzlsqmsch.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVja2lxZXhyd2FvcXpsc3Ftc2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTc5MzIsImV4cCI6MjA5NzA5MzkzMn0.jtmrWHa5Ures-OTHCPHwFPxP9egbP6rckNgpI4MvcW0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runTest() {
  const email = `test_tailor_${Math.floor(Math.random() * 100000)}@example.com`
  const password = 'Password123!'
  console.log(`Attempting signup for: ${email}`)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: 'test_username',
          phone: `+447911${Math.floor(Math.random() * 100000)}`
        }
      }
    })

    if (error) {
      console.error('Error returned by Supabase:')
      console.error(error)
    } else {
      console.log('Signup succeeded!', data)
    }
  } catch (err) {
    console.error('Caught error during execution:', err)
  }
}

runTest()
