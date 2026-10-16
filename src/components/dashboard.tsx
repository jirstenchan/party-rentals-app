import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function HomeScreen() {
  // Temporary mock array to generate the item cards shown in your wireframe
  const items = ["one", "two"];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* titol icons hart notif */}
        <View style={styles.headerRow}>
          <ThemedText style={styles.pageTitle}>Party Link</ThemedText>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#000000"
              />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color="#000000" />
            </Pressable>
          </View>
        </View>

        {/* ScrollView scroll thro events pero wa pay laman lol */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/*Search Bar*/}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rentals..."
              placeholderTextColor="#A0A0A0"
            />
            <Ionicons
              name="search-outline"
              size={20}
              color="#A0A0A0"
              style={styles.searchIcon}
            />
          </View>

          {/*Filter Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            <View
              style={[styles.categoryCapsule, styles.activeCategoryCapsule]}
            >
              <ThemedText style={styles.activeCategoryText}>All</ThemedText>
            </View>
          </ScrollView>

          {/*Hardcoded Item Cards List */}
          {items.map((item) => (
            <View key={item} style={styles.card}>
              {/* Left Side: Mock Image Placeholder Box */}
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={36} color="#CCCCCC" />
              </View>

              {/* Right Side: Mock Details Lines */}
              <View style={styles.cardDetails}>
                <View style={styles.skeletonLineLong} />
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 34,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#000000",
  },
  searchIcon: {
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    marginBottom: 20,
    maxHeight: 40,
  },
  categoryCapsule: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activeCategoryCapsule: {
    backgroundColor: "#2D2D2D",
  },
  categoryText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "600",
  },
  activeCategoryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    height: 140,
  },
  imagePlaceholder: {
    width: 100,
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  cardDetails: {
    flex: 1,
    justifyContent: "space-between",
    position: "relative",
  },
  skeletonLineLong: {
    height: 12,
    backgroundColor: "#D6D6D6",
    borderRadius: 6,
    width: "85%",
    marginTop: 4,
  },
  skeletonLineShort: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    width: "40%",
  },
  cardButtonPlaceholder: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: 24,
    width: 65,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
});
