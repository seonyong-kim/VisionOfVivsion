import React from "react";
import { View, Text, StyleSheet, Touchable, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Header = () => (
  <View style={styles.header}>
    <View style={styles.row}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="star-outline" size={60} color="#4FC3F7" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.headertext}>즐겨찾기</Text>
        </View>
    </View>
  </View>
)

const CRUD = () => (
  <View style={styles.CRUD}>
    <View style={styles.row}>

      {/*추가*/}
      <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => {}}>
        <View style={styles.buttonInner}>
          <View style={styles.iconArea}>
            <MaterialCommunityIcons name="plus-circle-outline" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.CRUDtextArea}>
            <Text style={styles.CRUDtext}>추가</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 삭제 */}
      <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => {}}>
        <View style={styles.buttonInner}>
          <View style={styles.iconArea}>
            <MaterialCommunityIcons name="trash-can-outline" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.CRUDtextArea}>
            <Text style={styles.CRUDtext}>삭제</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 변경 */}
      <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => {}}>
        <View style={styles.buttonInner}>
          <View style={styles.iconArea}>
            <FontAwesome name="pencil-square-o" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.CRUDtextArea}>
            <Text style={styles.CRUDtext}>변경</Text>
          </View>
        </View>
      </TouchableOpacity>

    </View>
  </View>
)


const FavoritesList = () => (
  <View style={{flex: 1, flexDirection: 'column'}}>

    <View style={styles.favoriteslist}>
      <Text></Text>
    </View>

    <View style={styles.favoriteslist}>
      <Text></Text>
    </View>

    <View style={styles.favoriteslist}>
      <Text></Text>
    </View>

    <View style={styles.favoriteslist}>
      <Text></Text>
    </View>

  </View>
);


const Favorites = () => {
  return(
    <View style={styles.container}>
      <Header/>
      <CRUD/>
      <FavoritesList/>
    </View>
  )
}
const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flex: 2,
    justifyContent: "center"
  },
  headertext:{
    textAlign: 'center',
    fontSize: 60,
    color: '#4FC3F7',
  },
  CRUD: {
    flex: 1,
    justifyContent: "center"
  },
  button:{
    justifyContent: "center"
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  CRUDiconArea:{
    flex: 1,
    alignItems: 'center',
  },
  CRUDtextArea:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  CRUDtext: {
    flex: 3,
    justifyContent: 'center',
    fontSize: 30,
    color: '#FFFFFF'
  },
  row:{
    flexDirection: "row",    // 아이콘과 텍스트 가로 배치
    alignItems: "center",
    justifyContent: "center"
  },
  iconContainer: {
    flex: 1,               // 전체 4중 1 (25%)
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 3,               // 전체 4중 3 (75%)
    justifyContent: 'center',
  },
  favoriteslist: {
    flex: 2,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
});

export default Favorites;