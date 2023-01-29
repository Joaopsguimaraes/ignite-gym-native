import LogoSvg from "@assets/logo.svg";
import { Input } from "@components/Input";
import { Button } from "@components/Button";
import BackgroundImg from "@assets/background.png";
import { useNavigation } from "@react-navigation/native";
import { AuthNavigatorRouteProps } from "@routes/auth.routes";
import { Controller, useForm } from "react-hook-form";
import {
  VStack,
  Image,
  Text,
  Center,
  Heading,
  ScrollView,
  useToast,
} from "native-base";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { api } from "@services/api";
import { AppError } from "@utils/AppError";
import { useState } from "react";
import { useAuth } from "@hooks/useAuth";

type FormDataProps = {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
};

const signUpSchema = yup.object({
  name: yup.string().required("Informe o nome"),
  email: yup.string().required("Informe o e-mail").email("E-mail inválido"),
  password: yup
    .string()
    .required("Informe a senha")
    .min(6, "A senha deve ter pelo menos 6 dígitos."),
  password_confirm: yup
    .string()
    .required("Confirme a senha.")
    .oneOf([yup.ref("password"), null], "A confirmação da senha não confere"),
});

export function SignUp() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { singIn } = useAuth();
  const navigation = useNavigation<AuthNavigatorRouteProps>();
  const toast = useToast();
  const { control, handleSubmit, formState } = useForm<FormDataProps>({
    resolver: yupResolver(signUpSchema),
    mode: "all",
    criteriaMode: "all",
  });

  function handleNavigateBack(): void {
    navigation.goBack();
  }

  async function handleSignUp({
    name,
    email,
    password,
  }: FormDataProps): Promise<void> {
    try {
      setIsLoading(true);
      await api.post("/users", { name, email, password });
      await singIn(email, password);
    } catch (error) {
      setIsLoading(false);
      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi possível criar a conta. Tente novamente mais tarde";

      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack flex={1} px={10} pb={16}>
        <Image
          source={BackgroundImg}
          defaultSource={BackgroundImg}
          alt="Background"
          resizeMode="contain"
          position="absolute"
        />
        <Center my={24}>
          <LogoSvg />
          <Text color="gray.100" fontSize="sm">
            Treine sua mente e o seu corpo
          </Text>
        </Center>
        <Center>
          <Heading color="gray.100" fontFamily="heading" fontSize="xl" mb={6}>
            Crie sua conta
          </Heading>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input
                placeholder="Nome"
                onChangeText={field.onChange}
                value={field.value}
                errorMessage={formState.errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={field.onChange}
                value={field.value}
                errorMessage={formState.errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                placeholder="Senha"
                secureTextEntry
                onChangeText={field.onChange}
                value={field.value}
                errorMessage={formState.errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password_confirm"
            render={({ field }) => (
              <Input
                placeholder="Confirme a senha"
                secureTextEntry
                onChangeText={field.onChange}
                value={field.value}
                onSubmitEditing={handleSubmit(handleSignUp)}
                errorMessage={formState.errors.password_confirm?.message}
              />
            )}
          />
          <Button
            isLoading={isLoading}
            title="Criar e acessar"
            onPress={handleSubmit(handleSignUp)}
          />
        </Center>
        <Button
          title="Volta para o login"
          variant="outline"
          mt={12}
          onPress={handleNavigateBack}
        />
      </VStack>
    </ScrollView>
  );
}
