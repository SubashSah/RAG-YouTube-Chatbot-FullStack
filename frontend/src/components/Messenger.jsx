import { useFetcher } from "react-router";
import { useEffect, useState } from "react";

import { FiSend } from "react-icons/fi";
import Modal from "./Modal";


export default function Messenger() {
    const [query, setQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const fetcher = useFetcher();


    function handleSend() {
        const userMessage = query;
        setQuery("");
        setMessages(prev => [...prev,
        { role: 'user', text: userMessage }
        ]);
        const formData = new FormData();
        formData.append("query", userMessage);

        fetcher.submit(formData, { method: "post" });
    }

    useEffect(() => {
         if (fetcher.data?.status === 409) {
            setShowModal(true);
        }

        if (fetcher.data?.answer) {
            setMessages(prev => [
                ...prev,
                { role: 'AI', text: fetcher.data.answer }
            ]);
            setShowModal(false);
        }
    }, [fetcher.data]);

    return (
        <>
        {showModal &&  <Modal/>}
            <h2 className="text-l font-bold m-3">AI Chat System</h2>
            <div className="border border-slate-700 my-4"></div>
            <div className="flex flex-col gap-5  h-[70%] overflow-auto hide-scrollbar bg-slate-900 rounded-xl">
                {messages.map((message, index) => (
                    <p
                        key={index}
                        className={message.role === "user"
                            ? "max-w-[75%]  ml-auto bg-indigo-600 mr-2 px-2 py-1 rounded-md"
                            : "max-w-[75%] bg-slate-800 ml-2 mr-auto px-2 py-1 rounded-md"
                        }
                    >
                        {message.text}
                    </p>
                ))}


                <div className="absolute bottom-5  bg-slate-900 flex items-end justify-center gap-2  w-full p-3 rounded-xl border border-slate-700  shadow-[0_0_15px_rgba(99,102,241,0.25)] ">

                    <textarea

                        value={query}
                        onChange={(e) => { setQuery(e.target.value) }}
                        placeholder="Ask Chatbot"
                        rows={1}
                        disabled={showModal}
                        className="w-full bg-slate-900 outline-none min-h-10 text-wrap max-h-30 hide-scrollbar"
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    />

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!query.trim() || showModal}
                        className="bg-indigo-700 flex items-center   gap-2 h-10 px-4 font-semibold text-[14px] rounded-lg cursor-pointer  hover:bg-indigo-500 disabled:cursor-not-allowed"
                    >
                        <FiSend />
                        Send
                    </button>

                </div>

            </div>
        </>
    )
}

export async function action({ request }) {
    const data = await request.formData();
    const query = data.get('query');

    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/ask`, {
        method: request.method,
        headers: {
            "Content-Type": "Application/json"
        },
        body: JSON.stringify({ question: query },),
    });

    const result = await response.json();

    if (!response.ok) {
        return {
            error: result.detail,
            status: response.status
        }
    }
    return result;

}