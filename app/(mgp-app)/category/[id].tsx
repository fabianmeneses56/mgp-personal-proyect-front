import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

const CategoryScreen = () => {
  const { id, data } = useLocalSearchParams();

  useEffect(() => {
    console.log(id, data);
  }, []);

  return (
    <View>
      <Text>{id}</Text>
      <Text>{data}</Text>
    </View>
  );
};

export default CategoryScreen;
