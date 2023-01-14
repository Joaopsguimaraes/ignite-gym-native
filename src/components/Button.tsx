import { IButtonProps, Button as NativeButton, Text } from "native-base";

interface Props extends IButtonProps {
  title: string;
  variant?: "outline" | "solid";
}

export function Button({ title, variant = 'solid', ...rest }: Props) {
  return (
    <NativeButton
      bg={variant === "outline" ? "transparent" : "green.700"}
      borderWidth={variant === "outline" ? 1 : 0}
      borderColor={variant === "outline" ? "green.500" : "transparent"}
      w="full"
      h={14}
      rounded="sm"
      _pressed={{
        bg: variant === "outline" ? "gray.500" : "green.500",
      }}
      {...rest}
    >
      <Text
        fontFamily="heading"
        color={variant === "outline" ? "green.500" : "white"}
        fontSize="sm"
      >
        {title}
      </Text>
    </NativeButton>
  );
}
