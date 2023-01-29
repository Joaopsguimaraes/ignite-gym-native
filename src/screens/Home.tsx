import { ExerciseCard } from "@components/ExerciseCard";
import { Group } from "@components/Group";
import { HomeHeader } from "@components/HomeHeader";
import { Loading } from "@components/Loading";
import { ExerciseDTO } from "@dtos/ExerciseDTO";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppNavigatorRoutesProps } from "@routes/app.routes";
import { api } from "@services/api";
import { AppError } from "@utils/AppError";
import { FlatList, HStack, Heading, Text, VStack, useToast } from "native-base";
import { useCallback, useEffect, useState } from "react";

export function Home() {
  const toast = useToast();
  const [groups, setGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupSelected, setGroupSelected] = useState("antebraço");
  const navigation = useNavigation<AppNavigatorRoutesProps>();

  function handleOpenExerciseDetails(exerciseId: string) {
    navigation.navigate("exercise", { exerciseId });
  }

  async function fetchGroups() {
    try {
      const { data } = await api.get("/groups");

      setGroups(data);
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível carregar os grupos musculares";
      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    }
  }

  async function fetchExercisesByGroup() {
    try {
      setIsLoading(true);

      const { data } = await api.get(`/exercises/bygroup/${groupSelected}`);

      setExercises(data);
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError
        ? error.message
        : "Não foi possível carregar os exercícios";
      toast.show({
        title,
        placement: "top",
        bgColor: "red.500",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExercisesByGroup();
    }, [groupSelected])
  );

  return (
    <VStack flex={1}>
      <HomeHeader />
      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Group
            name={item}
            isActive={
              groupSelected.toLocaleLowerCase() === item.toLocaleLowerCase()
            }
            onPress={() => setGroupSelected(item)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        _contentContainerStyle={{
          px: 8,
        }}
        my={8}
        minH={10}
        maxH={10}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <VStack px={8}>
          <HStack justifyContent="space-between" mb={3}>
            <Heading color="gray.200" fontSize="md">
              Exercícios
            </Heading>
            <Text color="gray.200" fontSize="sm">
              {exercises.length}
            </Text>
          </HStack>
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCard
                data={item}
                onPress={() => handleOpenExerciseDetails(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            _contentContainerStyle={{
              paddingBottom: 20,
            }}
          />
        </VStack>
      )}
    </VStack>
  );
}
