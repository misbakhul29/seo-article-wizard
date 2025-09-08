
import React from 'react';

const messages = [
  "Consulting with SEO experts...",
  "Brewing fresh content...",
  "Optimizing for search engines...",
  "Weaving keywords into the narrative...",
  "Assembling the perfect article...",
  "Checking for plagiarism (just kidding!)...",
  "Finalizing headings and meta tags..."
];

export const Loader: React.FC = () => {
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-slate-300">{message}</p>
        </div>
    );
};
