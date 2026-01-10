import { useState, useRef, useEffect } from 'react'
import supabase from './supabaseClient'

function App() {
  const [messages, setMessages] = useState([
    { id: 1, author: 'Alice', text: 'Welcome to Chit-Chat!', time: 'Now' },
    { id: 2, author: 'Alice', text: 'Hi everyone 👋', time: 'Now' },
  ])
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const [session, setSession] = useState(null)
  const [online, setOnline] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }}) => {
      setSession(session)
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  //sign in function
  const signIn = async () =>{
    await supabase.auth.signInWithOAuth({ provider: 'google',
       options: {
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
  }

  //sign out function
  const signOut = async () => {
    const {error} = await supabase.auth.signOut()
    setSession(null)
    if (error) console.log('Error signing out:', error.message)
  }

  useEffect(() => {
    if (!session?.user){
      setOnline([]);
      return
    }

    const roomOne = supabase.channel('room-one', {
      config:{
        presence: {
          key: session?.user?.id,
        }
      }
    })

    roomOne.on('broadcast', { event: 'message' }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
    })

    //track user room presence
    roomOne.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await roomOne.track({
          // include display info in presence metadata so we can show names
          id: session?.user?.id,
          name: session?.user?.user_metadata?.name || session?.user?.email,
          avatar: session?.user?.user_metadata?.avatar_url,
        })
      }
    })

    //handle user presence
    roomOne.on('presence', { event: 'sync' }, () => {
      const state = roomOne.presenceState();
      // extract one display name per user (fallback to id if name missing)
      const users = Object.entries(state).map(([key, metas]) => metas?.[0]?.name || metas?.[0]?.id || key);
      setOnline([...users])
    } )

    return () => {
      roomOne.unsubscribe()
    }

  }, [session])
  
  useEffect(() => {
    
  }, [online]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const payload = {
        message: text,
        user_name: session?.user?.user_metadata?.name || session?.user?.email,
        user_email: session?.user?.email,
        avatar: session?.user?.user_metadata?.avatar_url,
        timestamp: new Date().toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', hour12: true }),
      }
    supabase.channel('room-one').send({
      type: 'broadcast',
      event: 'message',
      payload
    })
    setMessages((s) => [...s, payload])
    setText('')

  //save message to supabase
    const { error } = await supabase.from('messages').insert([
    {
      user_id: session?.user?.id,
      user_email: session?.user?.email,
      username: session?.user?.user_metadata?.name, // optional
      time: payload.timestamp,
      avatar: payload.avatar,
      content: text //this text is from the input field (useState 'text' variable)
    }
  ])

  if (error) console.error('Error saving message:', error)
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error) setMessages(data);
    };

    fetchMessages();
  }, []);
  
  // const formatTime = (timestamp) => {
  //   if (!timestamp) return ''
  //   if timestamp is not a parsable date, return as is (e.g. now)
  //   if (isNaN( Date.parse(timestamp))) return timestamp
  //   return new Date(timestamp).toLocaleTimeString('en-us', { hour: 'numeric', minute: '2-digit', hour12: true })
  // }

  // const handleSend = (e) => {
  //   e.preventDefault()
  //   const trimmed = text.trim()
  //   if (!trimmed) return
  //   const next = {
  //     id: Date.now(),
  //     author: 'You',
  //     text: trimmed,
  //     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //   }
  //   setMessages((s) => [...s, next])
  //   setText('')
  // }

  //no session
  if (!session) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className='text-center space-y-6 px-6'>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-yellow-300 drop-shadow-md">
              Welcome to Chit-Chat
          </h1>

          <button onClick={signIn} className="px-6 py-3 rounded-md bg-orange-600 hover:bg-indigo-500 text-gray-9 00 text-lg font-medium transition transform active:scale-95">
            Sign in with Google
          </button>
        </div>
      </div>
    )
  } else {
    return (
      <div className="w-full h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
        <div className="border border-gray-700 w-full h-full rounded-lg flex flex-col overflow-hidden shadow-lg max-w-6xl mx-auto">
          {/* header */}
          <div className="flex items-center justify-between h-20 border-b border-gray-700 px-4">
            <div className="p-2">
              <p className="text-gray-300 font-medium">hello <span className="font-semibold">{session?.user?.user_metadata?.name || session?.user?.email }</span>
              </p>
              <p className="text-gray-300 italic text-sm">
                {online.length ? `${online.length} online: ${online.join(', ')}` : 'No users online'}
              </p>
            </div>
            <div className="p-2">
              <button onClick={signOut} className="px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition transform active:scale-95">
                Sign out
              </button>
            </div>
          </div>

          {/* chat area */}
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-[rgba(255,255,255,0.02)]">
            {messages.map((msg, idx) => {
              const mine = msg?.user_email === session?.user?.email
              return (
                <div
                  key={idx}
                  // className={`flex ${mine ? 'justify-end' : 'justify-start'} fade-in`}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'} fade-in`}
                >
                  {/* <div className={`${mine ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'} max-w-[80%] px-4 py-2 rounded-lg shadow-sm`}>
                    <div className="text-sm font-medium opacity-90">{mine ? 'You' : m.author}</div>
                    <div className="mt-1 break-words">{msg.text}</div>
                    <div className="text-xs opacity-60 mt-1 text-right">{msg.time}</div>
                  </div> */}

                  {/* received message - avatar on left */}

                  {!mine && (<img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full mr-2 my-auto" />)}

                  <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-sm ${mine ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    <p>{msg.content || msg.message || msg.text}</p>

                    {/* timestamp */}
                    <div className="text-xs opacity-60 mt-1 text-right">{msg.time || msg.timestamp}</div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* input / form */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 bg-gradient-to-t from-black/40 to-transparent">
            <div className="flex gap-3 items-center">
              <input
                aria-label="Type a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 bg-[#00000040] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition transform active:scale-95"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    )
}
}

export default App

/* Inline styles for simple fade-in animation */
// Adding small style tag so messages animate smoothly
const style = document.createElement('style')
style.innerHTML = `
.fade-in { opacity: 0; transform: translateY(6px); animation: fadeIn 260ms ease forwards; }
@keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
`
document.head.appendChild(style)
