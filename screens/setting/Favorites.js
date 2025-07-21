import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Header = () => (
  <View style={styles.header}>
    <View style={styles.row}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="star-outline" size={70} color="#FF8C42" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.headerText}>즐겨찾기</Text>
        </View>
    </View>
  </View>
)

{/*하위인 CRID에는 UI관련만 작성, 실제 로직을 알 필요는 없다.
  따라서 함수는 여기에 작성 안한다. */}
  {/*onAdd를 props로 받아서 onpress에 연결하는 방식으로 Modal을 호출한다.*/}
const CRUD = ({onAdd}) => (
  <View style={styles.CRUD}>
    <View style={styles.row}>

      <View style={{flex:2}}></View>
      
      <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={onAdd}>
        <View style={styles.buttonInner}>
          <View style={styles.iconArea}>
            <MaterialCommunityIcons name="plus-circle-outline" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.CRUDtextArea}>
            <Text style={styles.CRUDtext}>추가</Text>
          </View>
        </View>
      </TouchableOpacity>

    </View>
  </View>
)

const EditModal = ({visible, onClose, onSave, onDelete, name, setName, address, setAddress}) => (
  // 외부에 따로 정의한다면 
  // 모달 창을 띄우고
  // 여기에 위에 정보를 띄우고 밑에 수정 버튼과 삭제 버튼을 만든다.
  <Modal
  visible={visible}
  transparent
  animationType="slide">
    <View style={styles.modalBackground}>
      <View style={styles.modal}>
        <Text style={{fontSize:45, textAlign:'center', color:'#FFFFFF'}}>이름</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            multiline={true}
          />

        <Text style={{fontSize:45, textAlign:'center', color:'#FFFFFF'}}>주소</Text>
          <TextInput
            style={styles.modalInput}
            value={address}
            onChangeText={setAddress}
            multiline={true}
            color='#FFFFFF'
          />

        <View style={styles.row}>
          <TouchableOpacity onPress={onSave} 
            style={{ flex:1, justifyContent: "center", alignItems: 'center'}}>
            <Text style={{ fontSize: 35, color: '#FFFFFF', textAlign: 'center' }}>수정</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete} 
          style={{ flex:1, justifyContent: "center", alignItems: 'center'}}>
            <Text style={{ fontSize: 35, color: '#FFFFFF', textAlign: 'center' }}>삭제</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} 
          style={{ flex:1, justifyContent: "center", alignItems: 'center'}}>
            <Text style={{ fontSize: 35, color: '#FFFFFF', textAlign: 'center' }}>닫기</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  </Modal>
);

const FavoritesList = ({favoriteList, onItemPress}) => (
  // 1. Favorites 컴포넌트에서 favoriteList 상태를 FavoritesList에 props로 넘긴다
  // 2. FavoritesList 컴포넌트는 favoriteList를 받아서 FlatList로 렌더링
  // 3. FlatList는 data prop에 배열 주고, renderItem prop에 각 아이템을 어떻게 보여줄지 함수 주기
  // 4. FlatList에 한 화면에 몇 개씩 보여줄지, 스크롤할 수 있게 설정하기
  // 만약에 버튼으로 눌렀을 때 해당 정보가 뜨게 하려면 다르게 해야하나?

  <FlatList
    data={favoriteList}
    keyExtractor={item => item.id.toString()}
    renderItem={({item}) => (
      <TouchableOpacity style={styles.favoriteListButton} onPress={() => onItemPress(item)}>
        <Text style={styles.favoriteName}>{item.name}</Text>
        <Text style={styles.favoriteAddress}>{item.address}</Text>
      </TouchableOpacity>
    )}
  />
);

const AddModal = ({ visible, onClose, onSave, name, setName, address, setAddress }) => (
  <Modal 
  visible={visible} 
  transparent 
  animationType="slide">
    {/* 반투명 배경 - 화면 전체 덮음 */}
    <View style={styles.modalBackground}>
    {/* 모달 박스 */}
      <View style={styles.modal}>

        <Text style={{ fontSize: 60, marginBottom: 10, textAlign: "center", color:'#FFFFFF' }}>이름</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            multiline={true}
            placeholderTextColor='#FFFFFF'
            placeholder="이름을 입력하세요"
          />

        <Text style={{ fontSize: 60, marginBottom: 10, textAlign: "center", color:'#FFFFFF' }}>주소</Text>
          <TextInput
            style={styles.modalInput}
            value={address}
            onChangeText={setAddress}
            multiline={true}
            placeholderTextColor='#FFFFFF'
            placeholder="주소를 입력하세요"
          />
        
        {/*버튼 생성 -> 추가와 닫기*/}
        <View style={styles.row}>
          <TouchableOpacity onPress={onSave} 
            style={{ flex:1, justifyContent: "center", alignItems: 'center'}}>
            <Text style={{ fontSize: 35, color: '#FFFFFF', textAlign: 'center' }}>추가</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} 
          style={{ flex:1, justifyContent: "center", alignItems: 'center'}}>
            <Text style={{ fontSize: 35, color: '#FFFFFF', textAlign: 'center' }}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  </Modal>
);

{/*제일 상위인 Favorites에 함수를 만드는게 굿
  이유는 Favorites이 모든 로직을 알면 좋아서*/}
const Favorites = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('') 
  const [disabled, setDisabled] = useState(false); // 버튼 중복 방지를 위해서
  const [favoriteList, setFavoriteList] = useState([]) // 즐겨찾기 목록 저장용 상태 변수
  const [selectedItem, setSelectedItem] = useState(null); // 선택한 항목 정보
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // 수정 모달 띄우기
  // GET일때 추가 공부
  // 흐름만 적으면 getFavoriteList에서 fetch로 데이터를 받고 저장
  // 다음으로 useEffect로 처음에 화면에 뜨게 설정
  // 버튼을 누를때마다(추가, 삭제, 수정)반영시킨 DB를 가져오도록 설정
  // FlatList로 출력 
  const getFavoriteList = async() =>{
    const response = await fetch('https://c5fc-165-246-144-10.ngrok-free.app/setting/favorites',{
      method:"GET",
      headers:{
        "Content-Type" : "application/json"
      },
    })

    // 받은 데이터가 200인지 확인을 위해 .ok를 붙인다.
    if(response.ok){
      // response의 body 내용을 꺼내려면 .json()을 호출해야 한다.
      const data = await response.json()
      setFavoriteList(data)
    }else{
      console.log('서버 응답 실패')
    }
  }

  useEffect(() => {
    getFavoriteList();
  }, []);

  const handleSave = async() =>{
    if(disabled)
      return;

    setDisabled(true);
    // name과 address가 비어있는지 확인
    if(name == '' || address == ''){
      alert('이름과 주소를 모두 입력해주세요!')
      setDisabled(false);
      return
    }
    // 서버로 전송하기
    const response = await fetch('https://c5fc-165-246-144-10.ngrok-free.app/setting/favorites', {
      method: "POST",
      headers:{
        "Content-Type" : "application/json",
      },
      body: JSON.stringify({
        name: name,
        address: address,
      }),
    })
    // 전송 성공하면 빈값으로
    if(response.ok){
      await getFavoriteList();
      setName('');
      setAddress('');
      setDisabled(false);
    }else{
      alert('추가에 실패했습니다.')
    }
    setIsModalVisible(false)
  }

  const handleChange = async() =>{
    if(editName === '' || editAddress === ''){
      alert('이름과 주소를 모두 입력해주세요!')
      setDisabled(false);
      return
    }
    // 서버로 전송하기
    const response = await fetch(`https://c5fc-165-246-144-10.ngrok-free.app/setting/favorites/${selectedItem.id}`, {
      method: "PUT",
      headers:{
        "Content-Type" : "application/json",
      },
      body: JSON.stringify({
        name: editName,
        address: editAddress,
      }),
    })
    // 전송 성공하면 빈값으로
    if(response.ok){
      await getFavoriteList();
      setEditName('');
      setEditAddress('');
      setSelectedItem(null);
      setDisabled(false);
    }else{
      alert('변경에 실패하였습니다.')
    }
    setIsEditModalVisible(false)
  }

  const handleDelete = async() => {
    // 서버로 전송하기
    const response = await fetch(`https://c5fc-165-246-144-10.ngrok-free.app/setting/favorites/${selectedItem.id}`, {
      method: "DELETE",
      headers:{
        "Content-Type" : "application/json",
      }
    })
    if(response.ok){
      await getFavoriteList();
      setEditName('');
      setEditAddress('');
      setSelectedItem(null);
      setDisabled(false);
    }else{
      alert('삭제에 실패하였습니다.')
    }
    setIsEditModalVisible(false)
  }

  const onPressModalOpen = () =>{
    setIsModalVisible(true)
  }

  const onPressModalClose = () =>{
    setName('');
    setAddress('');
    setEditName('');
    setEditAddress('');
    setSelectedItem(null);
    setIsModalVisible(false);
    setIsEditModalVisible(false)
  }

  const handlePress = (item) =>{
  // 항목을 터치하면 기억하게 하기 위해 구성
  setSelectedItem(item); // item저장하게 하고
  // name과 address 수정할 준비
  setEditName(item.name);
  setEditAddress(item.address);
  // 모달을 열어준다.
  setIsEditModalVisible(true)
  // 이게 모달을 열어주는 이유는 <Modal visible={isEditModalVisible} ...>이게 true가 되면서 보이게 된다.
}

  return (
    <View style={styles.container}>

      <View style={{ flex: 3 }}>
        <Header />
      </View>

      <View style={{ flex: 2 }}>
        <CRUD onAdd={onPressModalOpen}/>{/*여기서 modal오픈 여부를 보내준다.*/}
      </View>

      <View style={{ flex: 8, flexDirection: 'column' }}>
        <FavoritesList favoriteList = {favoriteList} onItemPress={handlePress}/>
      </View>

      <AddModal visible={isModalVisible} onClose={onPressModalClose} onSave={handleSave}
      name = {name} setName = {setName} address = {address} setAddress = {setAddress}/>

      <EditModal visible={isEditModalVisible} onClose={onPressModalClose} onSave={handleChange} onDelete={handleDelete}
      name={editName} setName={setEditName} address={editAddress} setAddress={setEditAddress}/>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flex: 1,
    justifyContent: "center",
  },
  headerText: {
    textAlign: "center",
    fontSize: 60,
    color: "#FF8C42",
  },
  CRUD: {
    flex: 1,
    justifyContent: "center",
  },
  button: {
    justifyContent: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  CRUDiconArea: {
    flex: 1,
    alignItems: "center",
  },
  CRUDtextArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  CRUDtext: {
    flex: 3,
    justifyContent: "center",
    fontSize: 30,
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20
  },
  textContainer: {
    flex: 3,
    justifyContent: "center",
  },
  favoriteslist: {
    flex: 2,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  favoriteName: {
    fontSize: 35,
    color: "#FFFFFF",
    textAlign: 'center'
  },
  favoriteAddress: {
    fontSize: 35,
    color: "#FFFFFF",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    //elevation: 5, // 안드로이드 그림자
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backgroundColor: '#121212'
  },
  modalInput: {
    fontSize:30, 
    backgroundColor:'#2C2C2C',
    color:'#FFFFFF',
    borderWidth: 1,
    borderColor: '#121212', 
    borderRadius: 8,
    padding: 10,
  },
  favoriteListButton: {
    /* 1안
    color:'#FFFFFF',
    borderWidth: 1,
    borderColor: '#4FC3F7', 
    borderRadius: 8,
    */
    backgroundColor:'#2C2C2C',
    color:'#FFFFFF',
    borderWidth: 2,
    borderColor: '#121212', 
    borderRadius: 8,
  }
});

export default Favorites;