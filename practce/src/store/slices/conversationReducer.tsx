import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from '@reduxjs/toolkit'
/* eslint-disable */


const conversationSlice = createSlice({
  name: 'conversation',
    initialState: {
        messagesHistory: [] as {id?: string; role: string; content: string}[],
    },
    reducers: {
        addMessage: (state, action:PayloadAction<any>) => {
            state.messagesHistory.push(action.payload);
        },
        clearMessages: (state) => {
            state.messagesHistory = [];
        },
        setMessages: (state, action) => {
            state.messagesHistory = action.payload;
        },
        updateMessage: (state, action) => {
            // Find and update an existing message by ID
            const { id, content } = action.payload;
            const messageToUpdate = state.messagesHistory.find(message => message.id === id);
            if (messageToUpdate) {
              messageToUpdate.content = content;
            }
          },
    },
})

export const {addMessage, clearMessages, setMessages,updateMessage} = conversationSlice.actions;
export default conversationSlice.reducer;