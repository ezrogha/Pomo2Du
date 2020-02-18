import React, { Component } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet, Alert, Animated, Easing, Dimensions } from 'react-native';
import { connect } from 'react-redux';

import AddButton from './components/AddButton';
import ToggleTodoButton from './components/ToggleTodoButton';
import TodoItem from './components/TodoItem';
import { toggleTodo, deleteTodo, startTodo, stopTodo } from '../../store/actions/todoActions';

const { width } = Dimensions.get('window');

class Todo extends Component {
    static navigationOptions = ({ navigation }) => {
        const { state: { params = {} }, navigate } = navigation
        return {
            headerStyle: {
                backgroundColor: "#009DDD"
            },
            headerLeft: () => <AddButton navigate={navigate} />,
            headerTitle: () => <ToggleTodoButton
                todoTabState={params.todoButtonState}
                doneTabState={params.doneButtonState}
                changeTab={params.changeTab}
            />,
        }
    }

    state = {
        todoTabState: true,
        doneTabState: false,
        unCheckedItems: [],
        checkedItems: [],
        xTodoValues: [],
    }

    static getDerivedStateFromProps(props, state) {
        // Creating an animated value for each todo item
        const xTodoValues = props.todos.map(({ id }) => ({
            id,
            [`xTodoValue${id}`]: new Animated.Value(0)
        }))
        return { xTodoValues }
    }

    componentDidMount() {
        // Pass state to navigationOptions
        this.props.navigation.setParams({
            changeTab: this.changeTab,
            todoButtonState: true,
            doneButtonState: false,
        })
    }

    changeTab = (val) => {
        // 0 is for Todo
        // 1 is for Done
        const boolVal = val === 0 ? true : false
        this.setState({
            todoTabState: boolVal,
            doneTabState: !boolVal
        }, () => {
            this.props.navigation.setParams({
                changeTab: this.changeTab,
                todoButtonState: this.state.todoTabState,
                doneButtonState: !this.state.todoTabState
            })
        })
    }

    toggleCheckbox = ({ id, isChecked }) => {
        this.props.toggleTodo(id, isChecked)
    }

    animateDeletion = (id) => {
        const xTodoObjectIndex = this.state.xTodoValues.findIndex(obj => obj.id === id)
        const xTodoObject = this.state.xTodoValues[xTodoObjectIndex]
        const xTodoValue = xTodoObject[`xTodoValue${id}`]

        Animated.timing(
            xTodoValue,
            {
                toValue: width,
                duration: 400,
                easing: Easing.back()
            }
        ).start(() => {
            this.props.deleteTodo(id)
            this.setState({ todoTabState: !this.state.todoTabState }, () => {
                this.setState({ todoTabState: !this.state.todoTabState })
            })
        })
    }

    deleteTodo = ({ id, title }) => {
        Alert.alert(
            'Delete task',
            `Do you want to DELETE task to ${title}`,
            [
                { text: 'No', onPress: () => { }, style: 'cancel' },
                { text: 'Yes', onPress: () => this.animateDeletion(id) },
            ],
            { cancelable: false }
        )
    }

    segueToTimer = ({ title, id }) => {
        // START TIMER
        //Check if timer is running
        const isTimerRunning = this.props.todos.findIndex(({isRunning}) => isRunning === true )
        if (isTimerRunning !== -1) {
            // If there is another task running
            Alert.alert(
                'Another Task is Running',
                `Would you want to cancel it and start this one`,
                [
                    { text: 'No', onPress: () => { }, style: 'cancel' },
                    {
                        text: 'Yes', onPress: () => {
                            this.props.stopTodo()
                            this.props.startTodo(id)
                            this.props.navigation.navigate('Timer', { title })
                        }
                    },
                ],
                { cancelable: false }
            )
            return;
        }
        this.props.startTodo(id)
        this.props.navigation.navigate('Timer', { title })
    }

    segueToTodoInfo = (data) => {
        this.props.navigation.navigate('TodoInfo', data)
    }

    renderTodoList = () => {
        return this.props.todos.map((data, index) => {
            // Extract todo value from xTodoValues Array
            const id = data.id
            const xTodoObjectIndex = this.state.xTodoValues.findIndex(obj => obj.id === id)
            const xTodoObject = this.state.xTodoValues[xTodoObjectIndex]
            const xTodoValue = xTodoObject[`xTodoValue${id}`]
            if (this.state.todoTabState && !data.isChecked) {
                return (
                    <TodoItem key={index} data={data} toggleCheckbox={this.toggleCheckbox} segue={() => this.segueToTodoInfo(data)} deleteTodo={this.deleteTodo} startTask={this.segueToTimer} xTodoValue={xTodoValue} />
                )
            } else if (!this.state.todoTabState && data.isChecked) {
                return (
                    <TodoItem key={index} data={data} toggleCheckbox={this.toggleCheckbox} segue={() => this.segueToTodoInfo(data)} deleteTodo={this.deleteTodo} xTodoValue={xTodoValue} />
                )
            }
        })
    }

    checkIfListIsEmpty = () => {
        const checkedItems = this.props.todos.filter(({ isChecked }) => isChecked === true)
        const unCheckedItems = this.props.todos.filter(({ isChecked }) => isChecked === false)

        if (!this.state.todoTabState && checkedItems.length === 0) {
            return <View style={styles.emptyListView}><Text style={styles.emptyListText}>No Tasks Have been Completed</Text></View>
        } else if (this.state.todoTabState && unCheckedItems.length === 0) {
            return <View style={styles.emptyListView}><Text style={styles.emptyListText}>No Tasks to be done</Text></View>
        }
    }

    render() {
        return (
            <SafeAreaView
                style={{
                    marginVertical: 10
                }}
            >
                <ScrollView>
                    {this.checkIfListIsEmpty()}
                    {this.renderTodoList()}
                </ScrollView>
            </SafeAreaView>
        )
    }
}

const mapStateToProps = state => ({
    todos: state.todos,
    timer: state.timer
})

export default connect(mapStateToProps, {
    toggleTodo,
    deleteTodo,
    startTodo,
    stopTodo
})(Todo)

const styles = StyleSheet.create({
    emptyListView: {
        alignItems: 'center',
        marginTop: 10
    },
    emptyListText: {
        fontSize: 18,
        fontWeight: "bold",
        color: 'lightgrey'
    }
})