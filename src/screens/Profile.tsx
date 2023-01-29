import {
  Center,
  Heading,
  ScrollView,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "native-base";
import * as yup from "yup";
import { useState } from "react";
import { api } from "@services/api";
import { useAuth } from "@hooks/useAuth";
import { Input } from "@components/Input";
import { AppError } from "@utils/AppError";
import { Button } from "@components/Button";
import * as FileSystem from "expo-file-system";
import { TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { UserPhoto } from "@components/UserPhoto";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ScreenHeader } from "@components/ScreenHeader";
import defaultUser from "@assets/userPhotoDefault.png";

const PHOTO_SIZE = 33;

type FormDataProps = {
  name: string;
  email: string;
  password: string;
  old_password: string;
  confirm_password: string;
};

const profileSchema = yup.object({
  name: yup.string().required("Nome obrigatório"),
  password: yup
    .string()
    .nullable()
    .transform((value) => (!!value ? value : null)),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "As senhas devem ser iguais")
    .nullable()
    .transform((value) => (!!value ? value : null))
    .when("password", {
      is: (field: any) => field,
      then: yup
        .string()
        .nullable()
        .required("Confirmação de senha obrigatória")
        .transform((value) => (!!value ? value : null)),
    }),
});

export function Profile() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoIsLoading, setPhotoIsLoading] = useState(false);
  const toast = useToast();
  const { user, updateUserProfile } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataProps>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  async function handleUserPhotoSelected() {
    setPhotoIsLoading(true);
    try {
      const photoSelected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        aspect: [4, 4],
        allowsEditing: true,
      });
      if (photoSelected.assets) {
        const photoInfo = await FileSystem.getInfoAsync(
          photoSelected.assets[0].uri
        );
        if (photoInfo.size && photoInfo.size / 1024 / 1024 > 2) {
          return toast.show({
            title: "Essa imagem é muito grande. Escolha uma de até 5MB.",
            placement: "top",
            bgColor: "red.500",
          });
        }
        const fileExtension = photoSelected.assets[0].uri.split(".").pop();

        const photoFile = {
          name: `${user.name}.${fileExtension}`.toLowerCase(),
          uri: photoSelected.assets[0].uri,
          type: `${photoSelected.assets[0].type}/${fileExtension}`,
        } as any;

        const userPhotoUploadForm = new FormData();
        userPhotoUploadForm.append("avatar", photoFile);

        const avatarUpdatedResponse = await api.patch(
          "/users/avatar",
          userPhotoUploadForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const userUpdated = user;

        userUpdated.avatar = avatarUpdatedResponse.data.avatar;

        await updateUserProfile(userUpdated);

        toast.show({
          title: "Foto atualizada com sucesso!",
          placement: "top",
          bgColor: "green.500",
        });
      }
    } catch (error) {
      toast.show({
        title: `${error}`,
        placement: "top",
        bgColor: "red.500",
      });
      console.log(error);
    } finally {
      setPhotoIsLoading(false);
    }
  }

  async function handleProfileUpdate(data: FormDataProps) {
    try {
      setIsUpdating(true);

      const userUpdated = user;
      userUpdated.name = data.name;

      await api.put("/users", data);

      await updateUserProfile(userUpdated);

      toast.show({
        title: "Perfil atualizado com sucesso!",
        placement: "top",
        bgColor: "green.500",
      });
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError ? error.message : "Erro ao atualizar perfil";

      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <VStack flex={1}>
      <ScreenHeader title="Perfil" />
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <Center mt={6} px={10}>
          {photoIsLoading ? (
            <Skeleton
              w={PHOTO_SIZE}
              h={PHOTO_SIZE}
              rounded="full"
              startColor="gray.500"
              endColor="gray.400"
            />
          ) : (
            <UserPhoto
              source={
                user.avatar
                  ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` }
                  : defaultUser
              }
              alt="Foto do usuário"
              size={PHOTO_SIZE}
            />
          )}
          <TouchableOpacity onPress={handleUserPhotoSelected}>
            <Text
              color="green.500"
              fontWeight="bold"
              fontSize="md"
              mt={2}
              mb={8}
            >
              Alterar Foto
            </Text>
          </TouchableOpacity>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Nome"
                onChangeText={onChange}
                value={value}
                errorMessage={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="E-mail"
                isDisabled
                onChangeText={onChange}
                value={value}
                errorMessage={errors.email?.message}
              />
            )}
          />
        </Center>
        <VStack px={10} mt={12} mb={9}>
          <Heading color="gray.200" fontSize="md" mb={2}>
            Alterar senha
          </Heading>
          <Controller
            control={control}
            name="old_password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Senha antiga"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.old_password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange } }) => (
              <Input
                bg="gray.600"
                placeholder="Confirme a nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.confirm_password?.message}
              />
            )}
          />
          <Button
            title="Atualizar"
            mt={4}
            isLoading={isUpdating}
            onPress={handleSubmit(handleProfileUpdate)}
          />
        </VStack>
      </ScrollView>
    </VStack>
  );
}
