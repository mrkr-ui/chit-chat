import { useState, useRef, useEffect } from 'react'


function App() {
  const [messages, setMessages] = useState([
    { id: 1, author: 'Alice', text: 'Welcome to Chit-Chat!', time: 'Now' },
    { id: 2, author: 'You', text: 'Hi everyone 👋', time: 'Now' },
  ])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    const next = {
      id: Date.now(),
      author: 'You',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((s) => [...s, next])
    setText('')
  }

  return (
    <div className="w-full h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      <div className="border border-gray-700 w-full h-full rounded-lg flex flex-col overflow-hidden shadow-lg max-w-6xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between h-20 border-b border-gray-700 px-4">
          <div className="p-2">
            <p className="text-gray-300 font-medium">Signed in as <span className="font-semibold">Name</span></p>
            <p className="text-gray-300 italic text-sm">3 users online</p>
          </div>
          <div className="p-2">
            <button className="px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition transform active:scale-95">
              Sign out
            </button>
          </div>
        </div>

        {/* chat area */}
        <div className="flex-1 overflow-auto p-4 space-y-4 bg-[rgba(255,255,255,0.02)]">
          {messages.map((m) => {
            const mine = m.author === 'You'
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'} fade-in`}
              >
                <div className={`${mine ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'} max-w-[80%] px-4 py-2 rounded-lg shadow-sm`}>
                  <div className="text-sm font-medium opacity-90">{mine ? 'You' : m.author}</div>
                  <div className="mt-1 break-words">{m.text}</div>
                  <div className="text-xs opacity-60 mt-1 text-right">{m.time}</div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* input / form */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-700 bg-gradient-to-t from-black/40 to-transparent">
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

export default App

/* Inline styles for simple fade-in animation */
// Adding small style tag so messages animate smoothly
const style = document.createElement('style')
style.innerHTML = `
.fade-in { opacity: 0; transform: translateY(6px); animation: fadeIn 260ms ease forwards; }
@keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
`
document.head.appendChild(style)
