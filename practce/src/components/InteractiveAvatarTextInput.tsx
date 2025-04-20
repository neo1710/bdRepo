import { Input } from "@nextui-org/react";
/* eslint-disable */
interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: () => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export default function InteractiveAvatarTextInput({
  label,
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
}: StreamingAvatarTextInputProps) {
  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    onSubmit();
    setInput("");
  }

  return (
    <Input
    className="w-50%"
      placeholder={placeholder}
      value={input}
      onKeyDown={(e:any) => {
        if (e.key === "Enter") {
          handleSubmit();
        }
      }}
      onChange={(e:any)=>{setInput(e.target.value)}}
    />
  );
}
// mistral