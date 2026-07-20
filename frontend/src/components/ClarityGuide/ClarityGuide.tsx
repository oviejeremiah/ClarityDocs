import { useState, useEffect, useRef } from 'react';

interface GuideMessage {
  id: string;
  from: 'guide' | 'user';
  text: string;
}

interface QuickTopic {
  id: string;
  label: string;
  icon: string;
  answer: string;
}

const TOPICS: QuickTopic[] = [
  {
    id: 'what-is-this',
    label: 'What does this app do?',
    icon: 'ti-help-circle',
    answer: "ClarityDocs reads your documents and pulls out the important information automatically, so you don't have to type it in by hand. Upload an invoice, contract, or report, and within seconds you'll see the key details — vendor names, amounts, dates, terms — laid out clearly on screen.",
  },
  {
    id: 'how-to-upload',
    label: 'How do I upload a document?',
    icon: 'ti-upload',
    answer: "Go to the Documents page and either drag a file straight onto the upload box, or click Choose file to browse your computer. You can upload PDFs, Word documents, images (like photos of receipts), spreadsheets, or CSV files. It takes a few seconds to process.",
  },
  {
    id: 'what-types',
    label: 'What documents can I upload?',
    icon: 'ti-files',
    answer: "Right now ClarityDocs is built to understand three types: invoices, contracts, and reports. You don't need to tell it which type — it figures that out automatically when you upload. It accepts PDF, JPEG, PNG, CSV, Excel, Word, and plain text files, up to 20MB.",
  },
  {
    id: 'how-to-view-results',
    label: 'Where do I see the results?',
    icon: 'ti-eye',
    answer: "Once a document says Completed on the Documents page, click View results (the eye icon) to see everything that was extracted — laid out as a clear list you can read at a glance. You can also download the results as a CSV or JSON file to use in other programs like Excel.",
  },
  {
    id: 'what-is-confidence',
    label: 'What does confidence % mean?',
    icon: 'ti-star',
    answer: "The confidence score shows how sure the AI is about what it read. A higher percentage (like 90% and above) means the document was clear and the extracted details are very likely accurate. If it's lower, it's worth double-checking the details before relying on them.",
  },
  {
    id: 'failed-doc',
    label: 'My document failed. What now?',
    icon: 'ti-alert-triangle',
    answer: "Sometimes a document can't be read clearly — this can happen with blurry scans or unusual layouts. Click the Retry button (the circular arrow icon) next to the failed document to try again. If it keeps failing, try a clearer scan or a different file format.",
  },
  {
    id: 'change-look',
    label: 'Can I change how it looks?',
    icon: 'ti-palette',
    answer: "Yes. Click the Background button at the top of the screen to choose from several background styles, including a dark theme. Your choice is remembered every time you come back.",
  },
  {
    id: 'is-it-safe',
    label: 'Is my data safe?',
    icon: 'ti-shield-check',
    answer: "Your account is protected by a secure login, and every document is stored safely in a private database that only your organisation can access. Nobody outside your company can see your files or the information extracted from them.",
  },
];

const WELCOME_MESSAGE = "Hi, I'm Clarity — your guide to this app. I can explain what ClarityDocs does and how to get the most out of it. Pick a question below, or just explore the app. I'll be here if you need me.";

export function ClarityGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(
    () => localStorage.getItem('clarity_guide_seen') === 'true',
  );
  const [messages, setMessages] = useState<GuideMessage[]>([
    { id: 'welcome', from: 'guide', text: WELCOME_MESSAGE },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('clarity_guide_seen', 'true');
        setHasSeenWelcome(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function askTopic(topic: QuickTopic) {
    setMessages(prev => [
      ...prev,
      { id: `${topic.id}-q-${Date.now()}`, from: 'user', text: topic.label },
      { id: `${topic.id}-a-${Date.now()}`, from: 'guide', text: topic.answer },
    ]);
  }

  return (
    <div className="clarity-guide">
      {isOpen && (
        <div className="clarity-guide__panel">
          <div className="clarity-guide__header">
            <div className="clarity-guide__header-info">
              <div className="clarity-guide__avatar"><i className="ti ti-sparkles" aria-hidden="true" /></div>
              <div>
                <div className="clarity-guide__title">Clarity guide</div>
                <div className="clarity-guide__subtitle">Here to help you use the app</div>
              </div>
            </div>
            <button className="clarity-guide__close" onClick={() => setIsOpen(false)} aria-label="Close guide">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          <div className="clarity-guide__messages" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`clarity-guide__bubble clarity-guide__bubble--${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="clarity-guide__topics">
            <div className="clarity-guide__topics-label">Common questions</div>
            <div className="clarity-guide__topics-grid">
              {TOPICS.map(topic => (
                <button
                  key={topic.id}
                  className="clarity-guide__topic-btn"
                  onClick={() => askTopic(topic)}
                >
                  <i className={`ti ${topic.icon}`} aria-hidden="true" />
                  {topic.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className="clarity-guide__fab"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close help guide' : 'Open help guide'}
      >
        <i className={`ti ${isOpen ? 'ti-x' : 'ti-message-circle-2'}`} aria-hidden="true" />
      </button>
    </div>
  );
}