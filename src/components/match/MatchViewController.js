import React, {useEffect, useState} from 'react';
import {Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
    Image} from 'react-native';
import {Colors} from '../../utils/styles';
import MatchService from './MatchService';
import {ChannelType, MatchLikeTyp, MessageCategory, MessageMediaType} from '../../utils/Enums';
import {Message} from '../chat/model/Message';
import Animated, {
    Easing, interpolate,
    useAnimatedGestureHandler, useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
    call,
    runOnUI,
    runOnJS,
} from 'react-native-reanimated';
import {PanGestureHandler, State} from "react-native-gesture-handler";
import AnimationCard, {CardSize} from './view/AnimationCard';
const {width, height} = Dimensions.get('window')

const Position = {
    origin: 0,
    edge: 1,
    mid: 2,
}

const MaxEdgePositionX = (width - 60 + 100)

const MatchViewController = (props) => {
    const [dataSource, setDataSource] = useState([])
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [bgImageIndex, setBgImageIndex] = useState(1)
    const matchService: MatchService = new MatchService()
    const currentUserInfo = global.UserInfo
    const translation = {
        x: useSharedValue(0),
        y: useSharedValue(0)
    }
    const starLikeOpacity = useSharedValue(0)
    const springConfig = {
        damping: 15,
        mass: 0.5,
        stiffness: 100,
        overshootClamping: false,
        restSpeedThreshold: 1,
        restDisplacementThreshold: 0.5,
    }

    let position = useSharedValue(Position.origin)
        let gestureState = useSharedValue(State.UNDETERMINED)
    let images= [
        require('../../source/image/test/let.jpg'),
        require('../../source/image/test/blunt.jpg'),
        require('../../source/image/test/solo.jpg'),
        require('../../source/image/test/law.jpg'),
    ]

    useEffect(() => {
        // requestNearByPeople()
    })

    const updateFrontImageIndex = () => {
        let len = images.length
        let newIndex = (selectedImageIndex === (len - 1)) ? 0 : selectedImageIndex + 1
        setSelectedImageIndex(newIndex)
    }

    const handelUpdateBgImageIndex = () => {
        let len = images.length
        let newIndex = (bgImageIndex === (len - 1)) ? 0 : bgImageIndex + 1
        setBgImageIndex(newIndex)
    }

    const gestureHandler = useAnimatedGestureHandler({
        onStart:(_, ctx) => {
            ctx.startX = translation.x.value
            ctx.startY = translation.y.value
            position.value = Position.origin
        },
        onActive: (event, ctx) => {
            translation.x.value = ctx.startX + event.translationX

            let offsetY = 0
            if (event.translationY > 0) {
                offsetY = ctx.startY + (event.translationY > 30 ? 30 : event.translationY)
            }
            translation.y.value = offsetY
            position.value = Position.mid
        },
        onEnd: (event, ctx) => {
            let endPositionX = 0

            if (Math.abs(event.translationX) < width/4.0) {
                translation.x.value = withTiming(0)
                translation.y.value = withTiming(0)

                position.value = Position.origin
                return
            }

            if (translation.x.value < 0) {
                endPositionX = -MaxEdgePositionX
            }else {
                endPositionX = MaxEdgePositionX
            }

            position.value = Position.mid
            translation.y.value = withTiming(0)
            translation.x.value = withSpring(endPositionX, springConfig, () => {
                position.value = Position.edge
                runOnJS(updateFrontImageIndex)()
                translation.x.value = withTiming(0, {
                    duration: 100,
                }, () => {
                    position.value = Position.origin
                    runOnJS(handelUpdateBgImageIndex)()
                })
            })
        }
    })

    const frontImageContainerStyle = useAnimatedStyle(() => {
        const rotateZ = interpolate(translation.x.value, [-width/2.0, width/2.0], [15, -15], 'clamp') + 'deg'

        let opacity = 0.0
        let positionVal = position.value
        if (positionVal === Position.origin) {
            opacity = 1.0
        } else if (positionVal === Position.mid) {
            opacity = 1.0//interpolate(Math.abs(translation.x.value), [0, width/2.0], [1, 0.3], 'clamp')
        }else if (positionVal === Position.edge) {
            opacity = 0.0
        }
        return {
            borderRadius: 8,
            opacity: opacity,
            width: CardSize.width,
            transform: [
                {translateX: translation.x.value,},
                {translateY: translation.y.value},
                {rotateZ: rotateZ}
            ]}
    })

    const frontImageStyle = useAnimatedStyle(() => {
        return {
            borderRadius: 8,
            width: CardSize.width,
            height: CardSize.height,
        }
    })

    const bgImageStyle = useAnimatedStyle(() => {
        const translationX = Math.abs(translation.x.value)
        const positionVal = position.value
        const scale = positionVal !== Position.edge ? interpolate(translationX, [0, MaxEdgePositionX], [0.9, 1.0], 'clamp') : 1.0

        return {
            borderRadius: 8,
            width: CardSize.width*scale,
            height: CardSize.height*scale,
        }
    })

    const bgImageContainerStyle = useAnimatedStyle(() => {
        const translationX = Math.abs(translation.x.value)
        const positionVal = position.value
        const scale = positionVal !== Position.edge ? interpolate(translationX, [0, MaxEdgePositionX], [0.9, 1.0], 'clamp') : 1.0
        return {
            borderRadius: 8,
            width: CardSize.width*scale,
        }
    })

    const nopeContainerStyle = useAnimatedStyle(() => {
        if (starLikeOpacity.value > 0) {
            return {
                opacity: 0.0
            }
        }
        const translationX = translation.x.value
        const opacity = translationX < -10 ? interpolate(Math.abs(translationX), [10, width/2.0], [0.1, 1.0], 'clamp') : 0.0
        return {
            opacity: opacity
        }
    })

    const likeContainerStyle = useAnimatedStyle(() => {
        if (starLikeOpacity.value > 0) {
            return {
                opacity: 0.0
            }
        }
        const translationX = translation.x.value
        const opacity = translationX > 10 ? interpolate(Math.abs(translationX), [10, width/2.0], [0.1, 1.0], 'clamp') : 0.0
        return {
            opacity: opacity
        }
    })

    const starLikeContainerStyle = useAnimatedStyle(() => {
        const val = starLikeOpacity.value
        const opacity = interpolate(val, [0, 1.0], [0.0, 1.0], 'clamp')
        return {
            opacity: opacity
        }
    })

    const skipToNext = (isLike: true) => {
        let positionVal = position.value
        if (positionVal !== Position.origin) {
            return
        }

        let edgeX = isLike ? MaxEdgePositionX : -MaxEdgePositionX

        position.value = Position.mid
        translation.y.value = withSpring(0)
        translation.x.value = withSpring(edgeX, springConfig, () => {
            position.value = Position.edge
            runOnJS(updateFrontImageIndex)()
            translation.x.value = withTiming(0, {
                duration: 100,
            }, () => {
                position.value = Position.origin
                starLikeOpacity.value = 0.0
                runOnJS(handelUpdateBgImageIndex)()
            })
        })
    }

    const animationStarLikeOpacity = () => {
        starLikeOpacity.value = withSpring(1.0, {
            duration: 600,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, () => {
            runOnJS(skipToNext)(true)
        })
    }

    const handlerStageChanged = ({nativeEvent}) => {
        gestureState.value = nativeEvent.state
    }

    const requestNearByPeople = () => {
        const {ChatID} = currentUserInfo
        matchService.getNearbyPeople(ChatID, (data) => {
            setDataSource(data)
        }, () => {

        })
    }

    const clickToLike = (item) => {
        const {User} = item
        const peerChatId = User.ChatID
        const senderName = currentUserInfo.Name
        const chatId = currentUserInfo.ChatID

        addLikeStatus(peerChatId)

        const {Likes} = item
        if (Likes.findIndex((val) => {
            return val === chatId
        }) !== -1) {
            //如果是互粉， 那么就创建好友关系
            addNewFriend(chatId, peerChatId)
            sendCreateNewDialogMessage(senderName, chatId, peerChatId)
        }
    }

    const addLikeStatus = (peerChatId) => {
        matchService.addLikeStatus(peerChatId, MatchLikeTyp.like, (isSuccess) => {
            console.log(isSuccess ? 'Success' : 'Failed')
        }, () => {

        })
    }

    const addNewFriend = (chatId,friendId) => {
        matchService.addNewFriend(chatId, friendId, (isSuccess) => {
            console.log('add new friend: ' + isSuccess ? 'Success' : 'Failed')
        }, () => {

        })
    }

    const sendCreateNewDialogMessage = (senderName, chatId, friendId) => {
        let message = new Message()
        message.nickName = senderName
        message.mediaType = MessageMediaType.text
        message.senderId = chatId
        message.message = ''
        message.category = MessageCategory.newDialog
        message.channelType = ChannelType.single
        message.channelId = friendId

        matchService.sendNewMessageDialog(JSON.stringify(message))
    }

    const renderLikesItem = (dataSource) => {
        return dataSource.map((item, index) => {
            return(
                <Text key={index} style={{fontSize: 16, color: Colors.blue}}>{item}</Text>
            )
        })
    }

    const renderItem = () => {
        return dataSource.map((item, index) => {
            const {User, Likes} = item
            const {ChatID, Name} = User
            return (
                <TouchableOpacity onPress={() => {
                    clickToLike(item)
                }} key={index} style={{width: '100%', minHeight: 100, backgroundColor: Colors.white,
                    marginVertical: 10,
                }}>
                    <Text style={{fontSize: 18, color: Colors.black}}>{ChatID}</Text>
                    <Text style={{fontSize: 18, color: Colors.black}}>{Name}</Text>

                    {renderLikesItem(Likes)}
                </TouchableOpacity>
            )
        })
    }

    const getImageByIndex = (index) => {
        return images[((index >= images.length) ? 0 : index)]
    }

    const didClickToolBarButton = (item) => {
        const {type} = item
        if (type === ToolBarType.like) {
            skipToNext(true)
        }else if (type === ToolBarType.nope) {
            skipToNext(false)
        }else if (type === ToolBarType.star) {
            animationStarLikeOpacity()
        }
    }

    const renderToolBar = () => {
        const datas = [
            {type: ToolBarType.back, imageSource: require('../../source/image/match/Rewind.png'), bgColor: Colors.white},
            {type: ToolBarType.nope, imageSource: require('../../source/image/match/Nope.png'), bgColor: Colors.white},
            {type: ToolBarType.star, imageSource: require('../../source/image/match/Star.png'), bgColor: Colors.white},
            {type: ToolBarType.like, imageSource: require('../../source/image/match/Like.png'), bgColor: Colors.white},
        ]

        const size = 55
        return (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                width: CardSize.width, marginTop: 20,
            }}>
                {datas.map((item, idx) => {
                    return (
                        <TouchableOpacity key={idx} onPress={() => {
                           didClickToolBarButton(item)
                        }} style={{width: size, height: size, backgroundColor: item.bgColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: size/2.0
                        }}>
                            <Image source={item.imageSource}/>
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    }

    return(
		<SafeAreaView style={{flex: 1, backgroundColor: Colors.cardBgColor, alignItems: 'center'}}>
            <View style={{width: CardSize.width, marginTop: 30,}}>
                <View style={{position: 'absolute', width: '100%',
                    alignItems: 'center',
                }}>
                    <AnimationCard imageSource={getImageByIndex(bgImageIndex)}
                                   style={bgImageStyle}
                                   containerStyle={bgImageContainerStyle}
                                   likeContainerStyle={likeContainerStyle}
                                   nopeContainerStyle={nopeContainerStyle}
                                   starLikeContainerStyle={starLikeContainerStyle}
                    />
                </View>
                <PanGestureHandler onHandlerStateChange={handlerStageChanged} onGestureEvent={gestureHandler}>
                    <Animated.View>
                        <AnimationCard imageSource={getImageByIndex(selectedImageIndex)}
                                       style={frontImageStyle}
                                       containerStyle={frontImageContainerStyle}
                                       likeContainerStyle={likeContainerStyle}
                                       nopeContainerStyle={nopeContainerStyle}
                                       starLikeContainerStyle={starLikeContainerStyle}
                        />
                    </Animated.View>
                </PanGestureHandler>
            </View>

            {renderToolBar()}
		</SafeAreaView>
	)
}

export default MatchViewController

const ToolBarType = {
    nope: 0,
    like: 1,
    star: 2,
    back: 3,
}

