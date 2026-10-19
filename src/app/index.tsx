import LoadingScreen from "@/components/onboarding/loading-screen";

export default function HomeScreen() {
  return <LoadingScreen />;
}

// // src/app/index.tsx  (Home tab)
// import { StyleSheet } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// import { EventList } from "@/components/event/event-list";
// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { BottomTabInset, Spacing } from "@/constants/theme";

// export default function HomeScreen() {
//   return (
//     <ThemedView style={styles.container}>
//       <SafeAreaView style={styles.safeArea}>
//         <ThemedText type="title">Events</ThemedText>
//         <EventList emptyText="No events to join right now. Check back soon." />
//       </SafeAreaView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   safeArea: {
//     flex: 1,
//     paddingHorizontal: Spacing.three,
//     paddingBottom: BottomTabInset,
//     gap: Spacing.three,
//   },
// });
