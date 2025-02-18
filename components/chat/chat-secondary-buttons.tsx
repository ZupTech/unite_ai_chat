import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { FC, useContext } from "react"

interface ChatSecondaryButtonsProps {}

export const ChatSecondaryButtons: FC<ChatSecondaryButtonsProps> = ({}) => {
  const { selectedChat } = useContext(ChatbotUIContext)

  const { handleNewChat } = useChatHandler()

  return <>{selectedChat && <></>}</>
}
