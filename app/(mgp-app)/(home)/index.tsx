import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCategories } from "@/presentation/categories/hooks/useCategories";
import { useCategory } from "@/presentation/categories/hooks/useCategory";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { router, useNavigation } from "expo-router";

const HomeScreen = () => {
  const { categoriesQuery } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [formValue, setFormValue] = useState("");
  const navigation = useNavigation();
  const { productMutation } = useCategory(`new`);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AddNewButton onPressAction={() => setModalVisible(true)} />
      ),
    });
  }, [navigation]);

  if (categoriesQuery.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={30} />
      </View>
    );
  }

  const handleSubmit = async () => {
    await productMutation.mutate({
      name: formValue,
      exercise: [],
      id: "",
    });

    setModalVisible(false);
  };
  return (
    <View>
      <FlatList
        data={categoriesQuery.data}
        keyExtractor={(category) => category.id}
        renderItem={({ item }) => (
          <ThemedView
            style={{
              backgroundColor: "#F0F0F0",
              margin: 5,
              padding: 10,
              borderRadius: 5,
            }}
          >
            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/category/[id]`,
                  params: { id: item.id, data: JSON.stringify(item.exercise) },
                })
              }
            >
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      />

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <ThemedTextInput
            placeholder="Categoria"
            autoCapitalize="none"
            // icon="mail-outline"
            value={formValue}
            onChangeText={(value) => setFormValue(value)}
          />

          <Pressable
            style={[styles.button, { backgroundColor: "pink" }]}
            onPress={handleSubmit}
          >
            <Text style={styles.textStyle}>Save</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => {
              setFormValue("");
              setModalVisible(!modalVisible);
            }}
          >
            <Text style={styles.textStyle}>Hide Modal</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
export default HomeScreen;
