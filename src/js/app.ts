type MessageType = 'incoming' | 'outgoing' | 'loading'

type MessagePart = {
    text: string | null;
}

type MessageContent = {
    role: string,
    parts: MessagePart[],
}

type RequestBody = {
    contents: MessageContent[]
}

type RequestCandidates = {
    candidates: RequestBody[];
}


const typingForm = document.querySelector<HTMLFormElement>(".typing-form");
const chatList = document.querySelector<HTMLDivElement>('.chat-list');
const toggleThemeButton = document.querySelector<HTMLSpanElement>('#toggle-theme-button');

let userMessage: string | null = null;

const API_KEY: string = `AIzaSyAqUAKLKt3lo0huANWsxQmK2PCyVH8xBQo`;
const API_URL: string = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`


const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats")
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode')
    document.body.classList.toggle('light_mode', isLightMode)
    if(toggleThemeButton) {
        toggleThemeButton.innerText = isLightMode ? 'dark_mode' : 'light_mode'
    }

    if(chatList) {
        chatList.innerHTML = savedChats || ''
    }
}

loadLocalstorageData()

// Create a new message element
const createMessageElement = (content: string, ...classNames: MessageType[]): HTMLDivElement => {
    const div = document.createElement('div') as HTMLDivElement;
    div.classList.add('message', ...classNames);
    div.innerHTML = content 
    return div;
}

const showTypingEffect = (text: string, textElement: HTMLElement, incomingMessageDiv: HTMLElement): void => {
    const words = text.split(' ')
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(() => {
        textElement.innerHTML += (currentWordIndex === 0 ? '': " ") + words[currentWordIndex]
        incomingMessageDiv.querySelector('.icon')?.classList.add('hide');
        currentWordIndex++
        

        if(currentWordIndex === words.length) {
            clearInterval(typingInterval);
            const chatListInner = chatList?.innerHTML
            if(!chatListInner) return;
            incomingMessageDiv.querySelector('.icon')?.classList.remove('hide');
            localStorage.setItem("savedChats", chatListInner);
            console.log(chatList.scrollHeight)
            // chatList.scrollTo(0, chatList.scrollHeight)
        } 

    }, 75)
}

const generateAPIResponse = async (incomingMessageDiv: HTMLDivElement): Promise<void> => {
    const textElement = incomingMessageDiv.querySelector<HTMLElement>('.text')

    try {
        const requestBody: RequestBody = {
            contents: [
              {
                role: "user",
                parts: [{ text: userMessage }]
              }
            ]
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })

        const data = await response.json();

        const apiResponse: string = data?.candidates[0].content.parts[0].text.replace('/\*\*(.*?)\*\*/g', '$1');
        if (textElement) {
            showTypingEffect(apiResponse, textElement, incomingMessageDiv)
        } else {
            console.warn('textElement not found');
        }

    } catch(error) {
        console.log(error)
    } finally {
        incomingMessageDiv.classList.remove('loading')
    }
}

const showLoadingAnimation = async () => {
    const html = `<div class="message-content">
                    <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-gemini-icon.png" alt="Gemini Image" class="avatar">
                    <p class="text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
                </div>
                <span id='copy-icon' class="icon material-symbols-rounded">
                    loading
                </span>` as string;

    const incomingMessageDiv = createMessageElement(html, 'incoming', 'loading') as HTMLDivElement;
    chatList?.appendChild(incomingMessageDiv);
    
    await generateAPIResponse(incomingMessageDiv);
    incomingMessageDiv.addEventListener('click', copyMessage)
    const copy_icon = incomingMessageDiv.querySelector('#copy-icon') as HTMLElement;
    copy_icon.innerHTML = 'content_copy'
}


const copyMessage = (event: MouseEvent) => {
    const messageElement = (event.target as HTMLElement).parentElement?.querySelector('.text')
    const copyIcon = (event.target as HTMLElement);
    const messageText = messageElement?.textContent
    if(!messageText || !messageElement) return;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = 'done'
    setTimeout(() => copyIcon.innerText = 'content_copy', 1000)

}

const handleOutgoingChat = (): void => {
    const typingInput = typingForm?.querySelector('.typing-input') as HTMLInputElement;
    userMessage = typingInput.value.trim();

    if(!userMessage) return; // Exit if there is no message

    const html = `<div class="message-content">
                    <img src="https://ps.w.org/user-avatar-reloaded/assets/icon-256x256.png?rev=2540745" alt="User Image" class="avatar">
                    <p class="text"></p>
                </div>` as string;
                
    const outgoingMessageDiv = createMessageElement(html, 'outgoing') as HTMLDivElement;
    const textElement = outgoingMessageDiv.querySelector('.text') as HTMLParagraphElement
    if(textElement) textElement.innerText = userMessage
    chatList?.appendChild(outgoingMessageDiv)

    typingForm?.reset(); // Clear input fields

    setTimeout(showLoadingAnimation, 500);  // Show loading animation after a delay
}

// Toggle
toggleThemeButton?.addEventListener('click', () => {
    const isLightMode: boolean = document.body.classList.toggle('light_mode')
    localStorage.setItem('themeColor', isLightMode ? 'light_mode' : 'dark_mode')
    toggleThemeButton.innerText = isLightMode ? 'dark_mode' : 'light_mode'
})

// Prevent default form submission!
typingForm?.addEventListener("submit", (event: SubmitEvent): void => {
    event.preventDefault();
    
    handleOutgoingChat();
})

