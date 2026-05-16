import React, { useEffect, useRef, useState } from 'react'

type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: 'Hi! How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const historyItems = messages.filter((msg) => msg.role === 'user').slice(-5)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const modelInput =
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ??
    'gemini-1.5-flash'
  const model = modelInput.replace(/^models\//, '')

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    if (!apiKey) {
      setError('Missing VITE_GEMINI_API_KEY in your .env file.')
      return
    }
    setError(null)

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const contents = newMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      )

      if (!response.ok) {
        let message = `Request failed (${response.status})`
        try {
          const errorBody = await response.json()
          message = errorBody?.error?.message ?? message
        } catch {
          // Ignore JSON parsing errors.
        }
        throw new Error(message)
      }

      const data = await response.json()
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('')

      if (!reply) {
        throw new Error('No response text from Gemini.')
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-900/60 p-4 md:block">
          <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            ChatGPT Clone
          </div>
          <button className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800">
            + New chat
          </button>
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              History
            </p>
            <div className="space-y-2 text-sm text-zinc-400">
              {historyItems.length ? (
                historyItems.map((item) => (
                  <p key={item.id} className="truncate rounded-md bg-zinc-900 px-3 py-2">
                    {item.content}
                  </p>
                ))
              ) : (
                <p className="rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-500">
                  No history yet
                </p>
              )}
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">ChatGPT Clone</h1>
              <p className="text-xs text-zinc-400">Simple demo UI in React</p>
            </div>
            <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
              {model}
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === 'user'
                      ? 'ml-auto w-fit max-w-[80%] rounded-2xl bg-emerald-500/15 px-4 py-3 text-emerald-100'
                      : 'mr-auto w-fit max-w-[80%] rounded-2xl bg-zinc-900 px-4 py-3 text-zinc-100'
                  }
                >
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))}
              {isLoading ? (
                <div className="mr-auto w-fit max-w-[80%] rounded-2xl bg-zinc-900 px-4 py-3 text-zinc-100">
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
                    Assistant
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400">Thinking…</p>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          </section>

          <footer className="border-t border-zinc-800 px-6 py-4">
            <form
              onSubmit={handleSend}
              className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
              >
                {isLoading ? 'Sending…' : 'Send'}
              </button>
            </form>
            {error ? (
              <p className="mt-2 text-center text-xs text-rose-400">{error}</p>
            ) : (
              <p className="mt-2 text-center text-xs text-zinc-500">
                Powered by Gemini. Keep your API key private.
              </p>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
