import { IInputProps, Input as NativeInput } from "native-base";

interface Props extends IInputProps {}

export function Input({ ...rest }: Props) {
  return (
    <NativeInput
      bg="gray.700"
      h={14}
      px={4}
      mb={4}
      borderWidth={0}
      fontSize="md"
      color="white"
      fontFamily="body"
      placeholderTextColor="gray.300"
      _focus={{
        bg: "gray.700",
        borderWidth: 1,
        borderColor: "green.500",
      }}
      {...rest}
    />
  );
}
